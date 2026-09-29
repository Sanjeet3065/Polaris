import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AnalyticsFilterParams,
  EquipmentAnalyticsItem,
  EquipmentAnalyticsResponse,
  ResolvedTimeWindow
} from "./analytics.types";
import {
  calculateAverage,
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class EquipmentAnalyticsService {
  public async getEquipmentAnalytics(
    params: AnalyticsFilterParams
  ): Promise<EquipmentAnalyticsResponse> {
    const window: ResolvedTimeWindow = resolveTimeWindow(params);

    let stationFilter = {
      id: "ALL",
      code: "ALL",
      name: "All Antarctic Stations (Maitri & Bharati)"
    };

    const whereStationClause: any = {};
    if (params.stationId && params.stationId !== "ALL") {
      const station = await stationService.resolveStation(params.stationId);
      whereStationClause.stationId = station.id;
      stationFilter = {
        id: station.id,
        code: station.code,
        name: station.name
      };
    }

    if (params.category && params.category !== "ALL") {
      whereStationClause.category = params.category;
    }

    // Query all equipment with station and relations
    const equipment = await prisma.equipment.findMany({
      where: whereStationClause,
      include: {
        station: { select: { code: true, name: true } },
        healthRecords: {
          where: {
            recordedAt: {
              gte: window.currentStart,
              lte: window.currentEnd
            }
          },
          select: { healthPercent: true, recordedAt: true }
        },
        predictions: {
          orderBy: { generatedAt: "desc" },
          take: 1,
          select: {
            riskScore: true,
            riskBand: true,
            estimatedRulDays: true,
            healthScore: true,
            generatedAt: true
          }
        },
        _count: {
          select: {
            alerts: {
              where: {
                occurredAt: {
                  gte: window.currentStart,
                  lte: window.currentEnd
                }
              }
            },
            maintenanceRecords: true
          }
        }
      },
      orderBy: { healthPercent: "asc" }
    });

    const totalMonitored = equipment.length;
    const durationHours = Math.max(1, window.durationMs / (1000 * 60 * 60));
    // Sample expectation: total equipment records present
    const dataQuality = evaluateDataQuality(totalMonitored, 60, durationHours);

    if (totalMonitored === 0) {
      return {
        station: stationFilter,
        timeWindow: {
          start: window.currentStart.toISOString(),
          end: window.currentEnd.toISOString()
        },
        summary: {
          totalMonitored: 0,
          avgHealthScore: 0,
          healthyCount: 0,
          degradedCount: 0,
          criticalCount: 0
        },
        healthDistribution: [],
        riskDistribution: [],
        equipment: [],
        dataQuality
      };
    }

    // Count incidents associated with each equipment's code or sourceId in the time window
    const incidents = await prisma.incident.findMany({
      where: {
        startedAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      },
      select: { source: true, stationId: true }
    });

    let healthyCount = 0;
    let degradedCount = 0;
    let criticalCount = 0;

    let optimalBandCount = 0;
    let goodBandCount = 0;
    let degradedBandCount = 0;
    let criticalBandCount = 0;

    const riskCounts: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MODERATE: 0,
      LOW: 0
    };

    const items: EquipmentAnalyticsItem[] = equipment.map((eq) => {
      const hp = eq.healthPercent;
      if (hp >= 80) healthyCount++;
      else if (hp >= 50) degradedCount++;
      else criticalCount++;

      if (hp >= 90) optimalBandCount++;
      else if (hp >= 75) goodBandCount++;
      else if (hp >= 50) degradedBandCount++;
      else criticalBandCount++;

      const latestPred = eq.predictions[0] || null;
      if (latestPred?.riskBand) {
        const bandKey = latestPred.riskBand;
        riskCounts[bandKey] = (riskCounts[bandKey] || 0) + 1;
      }

      const histHealths = eq.healthRecords.map((h) => h.healthPercent);
      const avgHist = calculateAverage(histHealths);
      const minHist = histHealths.length > 0 ? roundTo(Math.min(...histHealths), 1) : null;
      const maxHist = histHealths.length > 0 ? roundTo(Math.max(...histHealths), 1) : null;

      // Incident matches by source matching equipment code
      const matchingIncidents = incidents.filter(
        (inc) => inc.stationId === eq.stationId && inc.source && inc.source.includes(eq.code)
      ).length;

      return {
        id: eq.id,
        code: eq.code,
        name: eq.name,
        stationCode: eq.station.code,
        category: eq.category,
        status: eq.status,
        healthPercent: roundTo(eq.healthPercent, 1) || 100,
        avgHistoricalHealth: avgHist ?? roundTo(eq.healthPercent, 1),
        minHistoricalHealth: minHist ?? roundTo(eq.healthPercent, 1),
        maxHistoricalHealth: maxHist ?? roundTo(eq.healthPercent, 1),
        riskScore: latestPred ? roundTo(latestPred.riskScore, 1) : null,
        riskBand: latestPred ? latestPred.riskBand : null,
        estimatedRulDays: latestPred?.estimatedRulDays ? roundTo(latestPred.estimatedRulDays, 1) : null,
        alertCount: eq._count.alerts,
        incidentCount: matchingIncidents,
        maintenanceCount: eq._count.maintenanceRecords,
        lastServiceAt: eq.lastServiceAt ? eq.lastServiceAt.toISOString() : null
      };
    });

    const avgHealth = calculateAverage(equipment.map((e) => e.healthPercent)) || 0;

    const healthDistribution = [
      { band: "Optimal (≥90%)", count: optimalBandCount, percentage: roundTo((optimalBandCount / totalMonitored) * 100, 1) || 0 },
      { band: "Good (75-89%)", count: goodBandCount, percentage: roundTo((goodBandCount / totalMonitored) * 100, 1) || 0 },
      { band: "Degraded (50-74%)", count: degradedBandCount, percentage: roundTo((degradedBandCount / totalMonitored) * 100, 1) || 0 },
      { band: "Critical (<50%)", count: criticalBandCount, percentage: roundTo((criticalBandCount / totalMonitored) * 100, 1) || 0 }
    ];

    const riskDistribution = Object.entries(riskCounts).map(([band, count]) => ({
      band,
      count
    }));

    return {
      station: stationFilter,
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      summary: {
        totalMonitored,
        avgHealthScore: avgHealth,
        healthyCount,
        degradedCount,
        criticalCount
      },
      healthDistribution,
      riskDistribution,
      equipment: items,
      dataQuality
    };
  }
}

export const equipmentAnalyticsService = new EquipmentAnalyticsService();
