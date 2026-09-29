import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AnalyticsFilterParams,
  MaintenanceAnalyticsResponse,
  ResolvedTimeWindow
} from "./analytics.types";
import {
  calculateAverage,
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class MaintenanceAnalyticsService {
  public async getMaintenanceAnalytics(
    params: AnalyticsFilterParams
  ): Promise<MaintenanceAnalyticsResponse> {
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

    // Query Maintenance Predictions (Phase 10 data)
    const predictions = await prisma.maintenancePrediction.findMany({
      where: {
        ...whereStationClause,
        generatedAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      },
      include: {
        equipment: { select: { code: true, name: true } },
        station: { select: { code: true } }
      },
      orderBy: { riskScore: "desc" }
    });

    // Query Maintenance Records (Work orders)
    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: {
        equipment: whereStationClause.stationId ? { stationId: whereStationClause.stationId } : undefined,
        scheduledAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      },
      include: {
        equipment: { select: { code: true, name: true } }
      },
      orderBy: { scheduledAt: "desc" }
    });

    const totalPredictions = predictions.length;
    const durationHours = Math.max(1, window.durationMs / (1000 * 60 * 60));
    const dataQuality = evaluateDataQuality(totalPredictions, 120, durationHours);

    if (totalPredictions === 0) {
      return {
        station: stationFilter,
        timeWindow: {
          start: window.currentStart.toISOString(),
          end: window.currentEnd.toISOString()
        },
        summary: {
          totalPredictions: 0,
          avgRiskScore: null,
          avgHealthScore: null,
          criticalRiskCount: 0,
          highRiskCount: 0,
          moderateRiskCount: 0,
          lowRiskCount: 0,
          avgRulDays: null,
          workOrdersCreatedCount: maintenanceRecords.length
        },
        riskDistribution: [],
        healthDistribution: [],
        rulDistribution: [],
        predictions: [],
        maintenanceHistory: maintenanceRecords.map((m) => ({
          id: m.id,
          equipmentCode: m.equipment.code,
          title: m.title,
          type: m.type,
          status: m.status,
          scheduledAt: m.scheduledAt.toISOString(),
          completedAt: m.completedAt ? m.completedAt.toISOString() : null
        })),
        dataQuality
      };
    }

    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;

    let optHealth = 0;
    let goodHealth = 0;
    let degHealth = 0;
    let critHealth = 0;

    let rulUnder7 = 0;
    let rul7to14 = 0;
    let rul14to30 = 0;
    let rulOver30 = 0;

    const riskScores: number[] = [];
    const healthScores: number[] = [];
    const rulDaysList: number[] = [];

    for (const p of predictions) {
      riskScores.push(p.riskScore);
      healthScores.push(p.healthScore);

      if (p.riskBand === "CRITICAL") criticalCount++;
      else if (p.riskBand === "HIGH") highCount++;
      else if (p.riskBand === "MODERATE" || p.riskBand === "GUARDED") moderateCount++;
      else lowCount++;

      if (p.healthScore >= 90) optHealth++;
      else if (p.healthScore >= 75) goodHealth++;
      else if (p.healthScore >= 50) degHealth++;
      else critHealth++;

      if (typeof p.estimatedRulDays === "number") {
        rulDaysList.push(p.estimatedRulDays);
        if (p.estimatedRulDays < 7) rulUnder7++;
        else if (p.estimatedRulDays <= 14) rul7to14++;
        else if (p.estimatedRulDays <= 30) rul14to30++;
        else rulOver30++;
      }
    }

    const avgRisk = calculateAverage(riskScores);
    const avgHealth = calculateAverage(healthScores);
    const avgRul = calculateAverage(rulDaysList);

    const riskDistribution = [
      { band: "Critical Risk", count: criticalCount },
      { band: "High Risk", count: highCount },
      { band: "Moderate Risk", count: moderateCount },
      { band: "Low Risk", count: lowCount }
    ];

    const healthDistribution = [
      { band: "Optimal (≥90)", count: optHealth },
      { band: "Good (75-89)", count: goodHealth },
      { band: "Degraded (50-74)", count: degHealth },
      { band: "Critical (<50)", count: critHealth }
    ];

    const rulDistribution = [
      { range: "< 7 days", count: rulUnder7 },
      { range: "7 - 14 days", count: rul7to14 },
      { range: "14 - 30 days", count: rul14to30 },
      { range: "> 30 days", count: rulOver30 }
    ];

    const formattedPredictions = predictions.map((p) => ({
      id: p.id,
      equipmentId: p.equipmentId,
      equipmentCode: p.equipment.code,
      equipmentName: p.equipment.name,
      stationCode: p.station.code,
      healthScore: roundTo(p.healthScore, 1) || 0,
      riskScore: roundTo(p.riskScore, 1) || 0,
      riskBand: p.riskBand,
      estimatedRulDays: p.estimatedRulDays ? roundTo(p.estimatedRulDays, 1) : null,
      confidence: roundTo(p.confidence, 1) || 0,
      recommendation: p.recommendation,
      generatedAt: p.generatedAt.toISOString()
    }));

    const formattedHistory = maintenanceRecords.map((m) => ({
      id: m.id,
      equipmentCode: m.equipment.code,
      title: m.title,
      type: m.type,
      status: m.status,
      scheduledAt: m.scheduledAt.toISOString(),
      completedAt: m.completedAt ? m.completedAt.toISOString() : null
    }));

    return {
      station: stationFilter,
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      summary: {
        totalPredictions,
        avgRiskScore: avgRisk,
        avgHealthScore: avgHealth,
        criticalRiskCount: criticalCount,
        highRiskCount: highCount,
        moderateRiskCount: moderateCount,
        lowRiskCount: lowCount,
        avgRulDays: avgRul,
        workOrdersCreatedCount: maintenanceRecords.length
      },
      riskDistribution,
      healthDistribution,
      rulDistribution,
      predictions: formattedPredictions,
      maintenanceHistory: formattedHistory,
      dataQuality
    };
  }
}

export const maintenanceAnalyticsService = new MaintenanceAnalyticsService();
