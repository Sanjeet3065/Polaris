import { prisma } from "../../config/prisma";
import {
  AnalyticsFilterParams,
  ResolvedTimeWindow,
  StationComparisonMetric,
  StationComparisonResponse
} from "./analytics.types";
import {
  calculateAverage,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class StationComparisonService {
  public async getStationComparison(
    params: AnalyticsFilterParams
  ): Promise<StationComparisonResponse> {
    const window: ResolvedTimeWindow = resolveTimeWindow(params);

    const stations = await prisma.station.findMany({
      where: { code: { in: ["MAITRI", "BHARATI"] } },
      orderBy: { code: "asc" }
    });

    const maitri = stations.find((s) => s.code === "MAITRI");
    const bharati = stations.find((s) => s.code === "BHARATI");

    // Gather station-specific metrics
    const fetchStationStats = async (stationId?: string) => {
      if (!stationId) return null;

      const [energy, env, equipment, alerts, incidents, inventory, predictions] = await Promise.all([
        prisma.energyReading.findMany({
          where: {
            stationId,
            recordedAt: { gte: window.currentStart, lte: window.currentEnd }
          }
        }),
        prisma.environmentalReading.findMany({
          where: {
            stationId,
            recordedAt: { gte: window.currentStart, lte: window.currentEnd }
          }
        }),
        prisma.equipment.findMany({
          where: { stationId },
          select: { healthPercent: true }
        }),
        prisma.alert.findMany({
          where: {
            stationId,
            occurredAt: { gte: window.currentStart, lte: window.currentEnd }
          },
          select: { status: true, severity: true }
        }),
        prisma.incident.findMany({
          where: {
            stationId,
            startedAt: { gte: window.currentStart, lte: window.currentEnd }
          },
          select: { status: true }
        }),
        prisma.inventoryItem.findMany({
          where: { stationId },
          select: { status: true }
        }),
        prisma.maintenancePrediction.findMany({
          where: {
            stationId,
            generatedAt: { gte: window.currentStart, lte: window.currentEnd }
          },
          select: { riskBand: true }
        })
      ]);

      const avgGen = calculateAverage(energy.map((e) => e.generationKw)) || 0;
      const avgCons = calculateAverage(energy.map((e) => e.consumptionKw)) || 0;
      const avgBat = calculateAverage(energy.map((e) => e.batteryPercent)) || 0;
      const latestFuel = energy.length > 0 ? roundTo(energy[energy.length - 1].fuelPercent, 1) || 0 : 0;

      const avgTemp = calculateAverage(env.map((e) => e.temperature)) || 0;
      const avgWind = calculateAverage(env.map((e) => e.windSpeed)) || 0;
      const avgPressure = calculateAverage(env.map((e) => e.pressure)) || 0;
      const avgVis = calculateAverage(env.map((e) => e.visibility)) || 0;

      const avgEqHealth = calculateAverage(equipment.map((eq) => eq.healthPercent)) || 0;
      const critRiskCount = predictions.filter((p) => p.riskBand === "CRITICAL").length;

      const openAlerts = alerts.filter((a) => a.status === "OPEN" || a.status === "ACTIVE").length;
      const critAlerts = alerts.filter((a) => a.severity === "CRITICAL").length;

      const openIncidents = incidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING").length;
      const critInv = inventory.filter((i) => i.status === "CRITICAL" || i.status === "OUT_OF_STOCK").length;

      return {
        energy: {
          avgGenerationKw: avgGen,
          avgConsumptionKw: avgCons,
          avgBatteryPercent: avgBat,
          fuelPercent: latestFuel
        },
        environment: {
          avgTemp,
          avgWindSpeed: avgWind,
          avgPressure,
          avgVisibility: avgVis
        },
        equipment: {
          total: equipment.length,
          avgHealth: avgEqHealth,
          criticalRiskCount: critRiskCount
        },
        alerts: {
          total: alerts.length,
          open: openAlerts,
          critical: critAlerts
        },
        incidents: {
          total: incidents.length,
          open: openIncidents
        },
        logistics: {
          totalItems: inventory.length,
          criticalItems: critInv
        }
      };
    };

    const maitriStats = await fetchStationStats(maitri?.id);
    const bharatiStats = await fetchStationStats(bharati?.id);

    const stationList: StationComparisonResponse["stations"] = [];

    if (maitri && maitriStats) {
      stationList.push({
        code: maitri.code,
        name: maitri.name,
        healthPercent: roundTo(maitri.healthPercent, 1) || 100,
        ...maitriStats
      });
    }

    if (bharati && bharatiStats) {
      stationList.push({
        code: bharati.code,
        name: bharati.name,
        healthPercent: roundTo(bharati.healthPercent, 1) || 100,
        ...bharatiStats
      });
    }

    const comparisonTable: StationComparisonMetric[] = [
      {
        metric: "Station Health Index",
        unit: "%",
        maitriValue: maitri ? roundTo(maitri.healthPercent, 1) : "N/A",
        bharatiValue: bharati ? roundTo(bharati.healthPercent, 1) : "N/A",
        note: "Composite station operational readiness rating"
      },
      {
        metric: "Average Power Generation",
        unit: "kW",
        maitriValue: maitriStats?.energy.avgGenerationKw ?? "N/A",
        bharatiValue: bharatiStats?.energy.avgGenerationKw ?? "N/A",
        note: "Continuous active microgrid generation"
      },
      {
        metric: "Average Power Consumption",
        unit: "kW",
        maitriValue: maitriStats?.energy.avgConsumptionKw ?? "N/A",
        bharatiValue: bharatiStats?.energy.avgConsumptionKw ?? "N/A",
        note: "Total station life-support and scientific load"
      },
      {
        metric: "Battery State of Charge",
        unit: "%",
        maitriValue: maitriStats?.energy.avgBatteryPercent ?? "N/A",
        bharatiValue: bharatiStats?.energy.avgBatteryPercent ?? "N/A",
        note: "Main battery bank reserve"
      },
      {
        metric: "Fuel Storage Reserve",
        unit: "%",
        maitriValue: maitriStats?.energy.fuelPercent ?? "N/A",
        bharatiValue: bharatiStats?.energy.fuelPercent ?? "N/A",
        note: "Bulk fuel storage tank levels"
      },
      {
        metric: "Ambient Temperature",
        unit: "°C",
        maitriValue: maitriStats?.environment.avgTemp ?? "N/A",
        bharatiValue: bharatiStats?.environment.avgTemp ?? "N/A",
        note: "External weather sensor average"
      },
      {
        metric: "Wind Speed",
        unit: "km/h",
        maitriValue: maitriStats?.environment.avgWindSpeed ?? "N/A",
        bharatiValue: bharatiStats?.environment.avgWindSpeed ?? "N/A",
        note: "Polar anemometer measurement"
      },
      {
        metric: "Barometric Pressure",
        unit: "hPa",
        maitriValue: maitriStats?.environment.avgPressure ?? "N/A",
        bharatiValue: bharatiStats?.environment.avgPressure ?? "N/A",
        note: "Station barometer reading"
      },
      {
        metric: "Equipment Fleet Health",
        unit: "%",
        maitriValue: maitriStats?.equipment.avgHealth ?? "N/A",
        bharatiValue: bharatiStats?.equipment.avgHealth ?? "N/A",
        note: "Mean health rating across all machinery"
      },
      {
        metric: "Active Open Alerts",
        unit: "count",
        maitriValue: maitriStats?.alerts.open ?? 0,
        bharatiValue: bharatiStats?.alerts.open ?? 0,
        note: "Unresolved operational alerts"
      },
      {
        metric: "Critical Risk Equipment",
        unit: "count",
        maitriValue: maitriStats?.equipment.criticalRiskCount ?? 0,
        bharatiValue: bharatiStats?.equipment.criticalRiskCount ?? 0,
        note: "Assets flagged with critical degradation advisory"
      },
      {
        metric: "Critical Inventory Items",
        unit: "count",
        maitriValue: maitriStats?.logistics.criticalItems ?? 0,
        bharatiValue: bharatiStats?.logistics.criticalItems ?? 0,
        note: "Stock items below emergency reserve threshold"
      }
    ];

    const observations: string[] = [
      `Maitri Station is operating at ${maitri ? roundTo(maitri.healthPercent, 1) : "N/A"}% health index with ${maitriStats?.alerts.open ?? 0} open alerts.`,
      `Bharati Station is operating at ${bharati ? roundTo(bharati.healthPercent, 1) : "N/A"}% health index with ${bharatiStats?.alerts.open ?? 0} open alerts.`,
      `Maitri power load averages ${maitriStats?.energy.avgConsumptionKw ?? 0} kW vs Bharati at ${bharatiStats?.energy.avgConsumptionKw ?? 0} kW.`,
      `Fuel storage reserve: Maitri ${maitriStats?.energy.fuelPercent ?? 0}% vs Bharati ${bharatiStats?.energy.fuelPercent ?? 0}%.`
    ];

    return {
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      stations: stationList,
      comparisonTable,
      observations
    };
  }
}

export const stationComparisonService = new StationComparisonService();
