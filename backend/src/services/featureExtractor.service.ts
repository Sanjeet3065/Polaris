import { prisma } from "../config/prisma";
import { FeatureVectorInput, PredictionRequestDto } from "./aiClient.service";
import { EquipmentCategory } from "@prisma/client";

export interface FeatureExtractionOptions {
  asOfTimestamp?: Date;
}

export class FeatureExtractorService {
  private static instance: FeatureExtractorService;

  private constructor() {}

  public static getInstance(): FeatureExtractorService {
    if (!FeatureExtractorService.instance) {
      FeatureExtractorService.instance = new FeatureExtractorService();
    }
    return FeatureExtractorService.instance;
  }

  /**
   * Deterministically extracts features for an equipment asset up to cutoff timestamp
   * Strictly enforces chronological splitting and prevents future data leakage.
   */
  public async extractFeatures(
    equipmentId: string,
    options?: FeatureExtractionOptions
  ): Promise<PredictionRequestDto> {
    const asOf = options?.asOfTimestamp ?? new Date();
    const sevenDaysAgo = new Date(asOf.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(asOf.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(asOf.getTime() - 180 * 24 * 60 * 60 * 1000);

    // 1. Fetch equipment record with station relation
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        station: true
      }
    });

    if (!equipment) {
      throw new Error(`Equipment with ID ${equipmentId} not found`);
    }

    // 2. Fetch EquipmentHealth records in the past 7 days (Chronological: recordedAt <= asOf)
    const healthRecords = await prisma.equipmentHealth.findMany({
      where: {
        equipmentId,
        recordedAt: {
          gte: sevenDaysAgo,
          lte: asOf
        }
      },
      orderBy: { recordedAt: "desc" },
      take: 200
    });

    // Latest health record at or before asOf
    const latestHealth = healthRecords.length > 0
      ? healthRecords[0]
      : await prisma.equipmentHealth.findFirst({
          where: {
            equipmentId,
            recordedAt: { lte: asOf }
          },
          orderBy: { recordedAt: "desc" }
        });

    // 3. Fetch Phase 9 Alerts in past 7 days
    const alerts7d = await prisma.alert.findMany({
      where: {
        stationId: equipment.stationId,
        OR: [
          { equipmentId: equipment.id },
          { message: { contains: equipment.code } },
          { sourceId: equipment.id }
        ],
        createdAt: {
          gte: sevenDaysAgo,
          lte: asOf
        }
      }
    });

    const criticalAlerts = alerts7d.filter(a => a.severity === "CRITICAL");
    const highAlerts = alerts7d.filter(a => a.severity === "HIGH");

    // Recurring alerts (same ruleCode triggered more than once)
    const ruleCodeCounts = new Map<string, number>();
    for (const a of alerts7d) {
      if (a.ruleCode) {
        ruleCodeCounts.set(a.ruleCode, (ruleCodeCounts.get(a.ruleCode) || 0) + 1);
      }
    }
    let recurringAlerts = 0;
    for (const count of ruleCodeCounts.values()) {
      if (count > 1) recurringAlerts += count;
    }

    // Unresolved alert duration
    let unresolvedDurationHours = 0;
    const unresolved = alerts7d.filter(a => a.status === "OPEN" || a.status === "ACKNOWLEDGED");
    if (unresolved.length > 0) {
      const oldestUnresolved = unresolved.reduce((min, cur) =>
        cur.createdAt < min ? cur.createdAt : min, unresolved[0].createdAt
      );
      unresolvedDurationHours = Math.max(0, (asOf.getTime() - oldestUnresolved.getTime()) / (1000 * 60 * 60));
    }

    // 4. Fetch Phase 9 Incidents in past 30 days
    const incidents30d = await prisma.incident.findMany({
      where: {
        stationId: equipment.stationId,
        OR: [
          { title: { contains: equipment.code } },
          { description: { contains: equipment.code } }
        ],
        createdAt: {
          gte: thirtyDaysAgo,
          lte: asOf
        }
      }
    });

    const activeIncidents = incidents30d.filter(
      i => i.status === "OPEN" || i.status === "INVESTIGATING" || i.status === "MITIGATING"
    );

    // 5. Fetch Maintenance records
    const lastMaintenance = await prisma.maintenanceRecord.findFirst({
      where: {
        equipmentId,
        completedAt: { lte: asOf }
      },
      orderBy: { completedAt: "desc" }
    });

    const maintenance180d = await prisma.maintenanceRecord.count({
      where: {
        equipmentId,
        completedAt: {
          gte: oneEightyDaysAgo,
          lte: asOf
        }
      }
    });

    let daysSinceLastMaint: number | null = null;
    if (lastMaintenance && lastMaintenance.completedAt) {
      daysSinceLastMaint = Math.max(0, (asOf.getTime() - lastMaintenance.completedAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    // 6. Rolling statistics for temperature & vibration
    const temperatures = healthRecords
      .map(r => r.temperature)
      .filter((t): t is number => t !== null && t !== undefined);
    const vibrations = healthRecords
      .map(r => r.vibration)
      .filter((v): v is number => v !== null && v !== undefined);

    const tempStats = this.computeStats(temperatures);
    const vibStats = this.computeStats(vibrations);

    // 7. Calculate trend slopes (change per day) using linear regression
    const healthTrendSlope = this.computeLinearTrendSlope(
      healthRecords.map(r => ({ time: r.recordedAt.getTime(), val: r.healthPercent })),
      asOf
    );

    const tempTrendSlope = this.computeLinearTrendSlope(
      healthRecords
        .filter(r => r.temperature !== null && r.temperature !== undefined)
        .map(r => ({ time: r.recordedAt.getTime(), val: r.temperature as number })),
      asOf
    );

    // 8. Nominal baselines and critical thresholds by equipment category
    const { baselineTemp, baselineVib, critTemp, critVib } = this.getBaselinesForCategory(equipment.category);

    const featureVector: FeatureVectorInput = {
      currentTemperature: latestHealth ? latestHealth.temperature : null,
      baselineTemp,
      currentVibration: latestHealth ? latestHealth.vibration : null,
      baselineVibration: baselineVib,
      currentRuntimeHours: latestHealth ? latestHealth.runtimeHours : null,
      currentHealthPercent: latestHealth ? latestHealth.healthPercent : equipment.healthPercent,
      tempMean7d: tempStats.mean,
      tempMin7d: tempStats.min,
      tempMax7d: tempStats.max,
      tempStdDev7d: tempStats.stdDev,
      vibrationMean7d: vibStats.mean,
      vibrationMax7d: vibStats.max,
      healthTrendSlope,
      tempTrendSlope,
      alertCount7d: alerts7d.length,
      criticalAlertCount7d: criticalAlerts.length,
      highAlertCount7d: highAlerts.length,
      unresolvedAlertDurationHours: Math.round(unresolvedDurationHours * 10) / 10,
      recurringAlertCount: recurringAlerts,
      incidentCount30d: incidents30d.length,
      activeIncidentCount: activeIncidents.length,
      daysSinceLastMaintenance: daysSinceLastMaint != null ? Math.round(daysSinceLastMaint * 10) / 10 : null,
      maintenanceCount180d: maintenance180d,
      temperatureThresholdCritical: critTemp,
      vibrationThresholdCritical: critVib
    };

    return {
      stationId: equipment.station.code,
      equipmentId: equipment.id,
      equipmentCode: equipment.code,
      equipmentCategory: equipment.category,
      featureVector,
      featureTimestamp: asOf.toISOString(),
      modelVersion: "1.0.0"
    };
  }

  /**
   * Linear regression slope: value delta per 24 hours (day)
   */
  private computeLinearTrendSlope(
    points: Array<{ time: number; val: number }>,
    now: Date
  ): number | null {
    if (points.length < 2) return null;

    // Convert time to days offset from now
    const nowMs = now.getTime();
    const data = points.map(p => ({
      x: (p.time - nowMs) / (1000 * 60 * 60 * 24), // negative days in past
      y: p.val
    }));

    const n = data.length;
    const meanX = data.reduce((acc, d) => acc + d.x, 0) / n;
    const meanY = data.reduce((acc, d) => acc + d.y, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (const d of data) {
      numerator += (d.x - meanX) * (d.y - meanY);
      denominator += (d.x - meanX) * (d.x - meanX);
    }

    if (denominator === 0) return 0;
    const slope = numerator / denominator;
    return Math.round(slope * 100) / 100;
  }

  private computeStats(values: number[]): {
    mean: number | null;
    min: number | null;
    max: number | null;
    stdDev: number | null;
  } {
    if (values.length === 0) {
      return { mean: null, min: null, max: null, stdDev: null };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / values.length;

    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((acc, v) => acc + v, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    return {
      mean: Math.round(mean * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      stdDev: Math.round(stdDev * 100) / 100
    };
  }

  private getBaselinesForCategory(category: EquipmentCategory): {
    baselineTemp: number;
    baselineVib: number;
    critTemp: number;
    critVib: number;
  } {
    switch (category) {
      case "GENERATOR":
        return { baselineTemp: 80.0, baselineVib: 1.5, critTemp: 95.0, critVib: 4.5 };
      case "HVAC":
        return { baselineTemp: 21.0, baselineVib: 0.8, critTemp: 35.0, critVib: 2.8 };
      case "BATTERY":
        return { baselineTemp: 20.0, baselineVib: 0.2, critTemp: 45.0, critVib: 1.2 };
      case "POWER_CONVERTER":
        return { baselineTemp: 45.0, baselineVib: 0.5, critTemp: 75.0, critVib: 2.0 };
      case "WATER_SYSTEM":
        return { baselineTemp: 45.0, baselineVib: 1.2, critTemp: 80.0, critVib: 3.5 };
      case "COMMUNICATION":
        return { baselineTemp: 35.0, baselineVib: 0.3, critTemp: 70.0, critVib: 1.5 };
      case "FUEL_SYSTEM":
        return { baselineTemp: 10.0, baselineVib: 0.8, critTemp: 35.0, critVib: 2.5 };
      default:
        return { baselineTemp: 50.0, baselineVib: 1.0, critTemp: 85.0, critVib: 3.0 };
    }
  }
}

export const featureExtractorService = FeatureExtractorService.getInstance();
