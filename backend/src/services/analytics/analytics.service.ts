import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AnalyticsFilterParams,
  OperationalSummary,
  OverviewAnalyticsResponse,
  ResolvedTimeWindow,
  TopKpiCard
} from "./analytics.types";
import {
  calculateAverage,
  calculateChangePercent,
  calculateTrend,
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class AnalyticsService {
  /**
   * Generates the high-level Executive Overview with Top 10 KPI cards and deterministic summary
   */
  public async getOverview(params: AnalyticsFilterParams): Promise<OverviewAnalyticsResponse> {
    const window: ResolvedTimeWindow = resolveTimeWindow(params);

    // 1. Resolve Station Scope
    let stationScope = {
      id: "ALL",
      code: "ALL",
      name: "All Antarctic Stations (Maitri & Bharati)"
    };

    const whereStationCurrent: any = {};
    const whereStationPrevious: any = {};

    if (params.stationId && params.stationId !== "ALL") {
      const station = await stationService.resolveStation(params.stationId);
      whereStationCurrent.stationId = station.id;
      whereStationPrevious.stationId = station.id;
      stationScope = {
        id: station.id,
        code: station.code,
        name: station.name
      };
    }

    // 2. Fetch Current & Previous Datasets in Parallel
    const [
      currEnergy,
      prevEnergy,
      currStations,
      currEquipment,
      prevEquipmentHealth,
      currAlerts,
      prevAlerts,
      currIncidents,
      prevIncidents,
      currPredictions,
      prevPredictions,
      currInventory
    ] = await Promise.all([
      // Current Energy
      prisma.energyReading.findMany({
        where: {
          ...whereStationCurrent,
          recordedAt: { gte: window.currentStart, lte: window.currentEnd }
        }
      }),
      // Previous Energy
      prisma.energyReading.findMany({
        where: {
          ...whereStationPrevious,
          recordedAt: { gte: window.previousStart, lte: window.previousEnd }
        }
      }),
      // Stations
      prisma.station.findMany({
        where: whereStationCurrent.stationId ? { id: whereStationCurrent.stationId } : undefined,
        select: { id: true, code: true, name: true, healthPercent: true, updatedAt: true }
      }),
      // Current Equipment
      prisma.equipment.findMany({
        where: whereStationCurrent.stationId ? { stationId: whereStationCurrent.stationId } : undefined,
        select: { id: true, healthPercent: true, status: true, updatedAt: true }
      }),
      // Previous Equipment Health records
      prisma.equipmentHealth.findMany({
        where: {
          recordedAt: { gte: window.previousStart, lte: window.previousEnd }
        },
        select: { healthPercent: true }
      }),
      // Current Alerts
      prisma.alert.findMany({
        where: {
          ...whereStationCurrent,
          occurredAt: { gte: window.currentStart, lte: window.currentEnd }
        },
        select: { id: true, status: true, severity: true, occurredAt: true }
      }),
      // Previous Alerts
      prisma.alert.findMany({
        where: {
          ...whereStationPrevious,
          occurredAt: { gte: window.previousStart, lte: window.previousEnd }
        },
        select: { id: true, status: true, severity: true }
      }),
      // Current Incidents
      prisma.incident.findMany({
        where: {
          ...whereStationCurrent,
          startedAt: { gte: window.currentStart, lte: window.currentEnd }
        },
        select: { id: true, status: true, startedAt: true }
      }),
      // Previous Incidents
      prisma.incident.findMany({
        where: {
          ...whereStationPrevious,
          startedAt: { gte: window.previousStart, lte: window.previousEnd }
        },
        select: { id: true, status: true }
      }),
      // Current Maintenance Predictions
      prisma.maintenancePrediction.findMany({
        where: {
          ...whereStationCurrent,
          generatedAt: { gte: window.currentStart, lte: window.currentEnd }
        },
        select: { riskScore: true, riskBand: true, generatedAt: true }
      }),
      // Previous Maintenance Predictions
      prisma.maintenancePrediction.findMany({
        where: {
          ...whereStationPrevious,
          generatedAt: { gte: window.previousStart, lte: window.previousEnd }
        },
        select: { riskScore: true, riskBand: true }
      }),
      // Inventory Items
      prisma.inventoryItem.findMany({
        where: whereStationCurrent.stationId ? { stationId: whereStationCurrent.stationId } : undefined,
        select: { id: true, status: true, updatedAt: true }
      })
    ]);

    // Data quality based on telemetry density
    const durationHours = Math.max(1, window.durationMs / (1000 * 60 * 60));
    const dataQuality = evaluateDataQuality(currEnergy.length, 5, durationHours);

    // 3. Mathematical Aggregations for Top 10 KPIs

    // KPI 1: Station Health
    const currStationHealth = calculateAverage(currStations.map((s) => s.healthPercent));
    // For station health, fallback to 100 or current average if no historical shift
    const prevStationHealth = currStationHealth;
    const stationHealthChange = calculateChangePercent(currStationHealth, prevStationHealth);
    const stationHealthTrend = calculateTrend(currStationHealth, prevStationHealth);

    // KPI 2: Average Power Generation (kW)
    const currAvgGen = calculateAverage(currEnergy.map((e) => e.generationKw));
    const prevAvgGen = calculateAverage(prevEnergy.map((e) => e.generationKw));
    const genChange = calculateChangePercent(currAvgGen, prevAvgGen);
    const genTrend = calculateTrend(currAvgGen, prevAvgGen);

    // KPI 3: Average Power Consumption (kW)
    const currAvgCons = calculateAverage(currEnergy.map((e) => e.consumptionKw));
    const prevAvgCons = calculateAverage(prevEnergy.map((e) => e.consumptionKw));
    const consChange = calculateChangePercent(currAvgCons, prevAvgCons);
    const consTrend = calculateTrend(currAvgCons, prevAvgCons);

    // KPI 4: Average Battery SoC (%)
    const currAvgBattery = calculateAverage(currEnergy.map((e) => e.batteryPercent));
    const prevAvgBattery = calculateAverage(prevEnergy.map((e) => e.batteryPercent));
    const batteryChange = calculateChangePercent(currAvgBattery, prevAvgBattery);
    const batteryTrend = calculateTrend(currAvgBattery, prevAvgBattery);

    // KPI 5: Average Fuel Reserve (%)
    const currAvgFuel = calculateAverage(currEnergy.map((e) => e.fuelPercent));
    const prevAvgFuel = calculateAverage(prevEnergy.map((e) => e.fuelPercent));
    const fuelChange = calculateChangePercent(currAvgFuel, prevAvgFuel);
    const fuelTrend = calculateTrend(currAvgFuel, prevAvgFuel);

    // KPI 6: Equipment Fleet Health (%)
    const currEqHealth = calculateAverage(currEquipment.map((eq) => eq.healthPercent));
    const prevEqHealth = calculateAverage(prevEquipmentHealth.map((h) => h.healthPercent)) ?? currEqHealth;
    const eqHealthChange = calculateChangePercent(currEqHealth, prevEqHealth);
    const eqHealthTrend = calculateTrend(currEqHealth, prevEqHealth);

    // KPI 7: Open Alerts
    const currOpenAlerts = currAlerts.filter((a) => a.status === "OPEN" || a.status === "ACTIVE").length;
    const prevOpenAlerts = prevAlerts.filter((a) => a.status === "OPEN" || a.status === "ACTIVE").length;
    const openAlertsChange = calculateChangePercent(currOpenAlerts, prevOpenAlerts);
    const openAlertsTrend = calculateTrend(currOpenAlerts, prevOpenAlerts);

    // KPI 8: Open Incidents
    const currOpenIncidents = currIncidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING").length;
    const prevOpenIncidents = prevIncidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING").length;
    const openIncidentsChange = calculateChangePercent(currOpenIncidents, prevOpenIncidents);
    const openIncidentsTrend = calculateTrend(currOpenIncidents, prevOpenIncidents);

    // KPI 9: Maintenance Risk (avg risk score 0 - 100)
    const currAvgRisk = calculateAverage(currPredictions.map((p) => p.riskScore));
    const prevAvgRisk = calculateAverage(prevPredictions.map((p) => p.riskScore));
    const riskChange = calculateChangePercent(currAvgRisk, prevAvgRisk);
    const riskTrend = calculateTrend(currAvgRisk, prevAvgRisk);

    // KPI 10: Inventory Critical Items
    const currCritInv = currInventory.filter((it) => it.status === "CRITICAL" || it.status === "OUT_OF_STOCK").length;
    // previous period inventory items approximate current count
    const prevCritInv = currCritInv;
    const critInvChange = 0;
    const critInvTrend = "STABLE";

    const latestEnergyTime = currEnergy.length > 0 ? currEnergy[currEnergy.length - 1].recordedAt.toISOString() : null;

    // 4. Construct the 10 Top KPI Cards
    const kpiCards: TopKpiCard[] = [
      {
        key: "station_health",
        label: "Station Health Index",
        currentValue: currStationHealth,
        previousValue: prevStationHealth,
        unit: "%",
        changePercent: stationHealthChange,
        trend: stationHealthTrend,
        status: (currStationHealth ?? 100) < 70 ? "CRITICAL" : (currStationHealth ?? 100) < 85 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: currStations[0]?.updatedAt ? currStations[0].updatedAt.toISOString() : null
      },
      {
        key: "power_generation",
        label: "Avg Power Generation",
        currentValue: currAvgGen,
        previousValue: prevAvgGen,
        unit: "kW",
        changePercent: genChange,
        trend: genTrend,
        status: "NEUTRAL",
        neutralChange: true,
        freshnessTimestamp: latestEnergyTime
      },
      {
        key: "power_consumption",
        label: "Avg Power Consumption",
        currentValue: currAvgCons,
        previousValue: prevAvgCons,
        unit: "kW",
        changePercent: consChange,
        trend: consTrend,
        status: "NEUTRAL",
        neutralChange: true,
        freshnessTimestamp: latestEnergyTime
      },
      {
        key: "battery_soc",
        label: "Avg Battery SoC",
        currentValue: currAvgBattery,
        previousValue: prevAvgBattery,
        unit: "%",
        changePercent: batteryChange,
        trend: batteryTrend,
        status: (currAvgBattery ?? 100) < 50 ? "CRITICAL" : (currAvgBattery ?? 100) < 70 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: latestEnergyTime
      },
      {
        key: "fuel_reserve",
        label: "Fuel Reserve Level",
        currentValue: currAvgFuel,
        previousValue: prevAvgFuel,
        unit: "%",
        changePercent: fuelChange,
        trend: fuelTrend,
        status: (currAvgFuel ?? 100) < 30 ? "CRITICAL" : (currAvgFuel ?? 100) < 50 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: latestEnergyTime
      },
      {
        key: "equipment_health",
        label: "Equipment Fleet Health",
        currentValue: currEqHealth,
        previousValue: prevEqHealth,
        unit: "%",
        changePercent: eqHealthChange,
        trend: eqHealthTrend,
        status: (currEqHealth ?? 100) < 60 ? "CRITICAL" : (currEqHealth ?? 100) < 80 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: currEquipment[0]?.updatedAt ? currEquipment[0].updatedAt.toISOString() : null
      },
      {
        key: "open_alerts",
        label: "Open Operational Alerts",
        currentValue: currOpenAlerts,
        previousValue: prevOpenAlerts,
        unit: "count",
        changePercent: openAlertsChange,
        trend: openAlertsTrend,
        status: currOpenAlerts > 10 ? "CRITICAL" : currOpenAlerts > 3 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: currAlerts[0]?.occurredAt ? currAlerts[0].occurredAt.toISOString() : null
      },
      {
        key: "open_incidents",
        label: "Active Incidents",
        currentValue: currOpenIncidents,
        previousValue: prevOpenIncidents,
        unit: "count",
        changePercent: openIncidentsChange,
        trend: openIncidentsTrend,
        status: currOpenIncidents > 2 ? "CRITICAL" : currOpenIncidents > 0 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: currIncidents[0]?.startedAt ? currIncidents[0].startedAt.toISOString() : null
      },
      {
        key: "maintenance_risk",
        label: "Maintenance Risk Index",
        currentValue: currAvgRisk,
        previousValue: prevAvgRisk,
        unit: "risk",
        changePercent: riskChange,
        trend: riskTrend,
        status: (currAvgRisk ?? 0) > 60 ? "CRITICAL" : (currAvgRisk ?? 0) > 35 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: currPredictions[0]?.generatedAt ? currPredictions[0].generatedAt.toISOString() : null
      },
      {
        key: "critical_inventory",
        label: "Critical Stock Items",
        currentValue: currCritInv,
        previousValue: prevCritInv,
        unit: "items",
        changePercent: critInvChange,
        trend: critInvTrend,
        status: currCritInv > 5 ? "CRITICAL" : currCritInv > 0 ? "WARNING" : "NORMAL",
        neutralChange: false,
        freshnessTimestamp: currInventory[0]?.updatedAt ? currInventory[0].updatedAt.toISOString() : null
      }
    ];

    // 5. Deterministic Operational Summary (Step 15: No LLM, deterministic templates)
    const totalGenKwh = roundTo((currAvgGen || 0) * durationHours, 1) || 0;
    const totalConsKwh = roundTo((currAvgCons || 0) * durationHours, 1) || 0;
    const netKwh = roundTo(totalGenKwh - totalConsKwh, 1) || 0;

    const criticalAlerts = currAlerts.filter((a) => a.severity === "CRITICAL").length;
    const highRiskEqCount = currPredictions.filter((p) => p.riskBand === "CRITICAL" || p.riskBand === "HIGH").length;
    const lowStockItems = currInventory.filter((it) => it.status === "LOW_STOCK").length;

    const latestFuelDays = currEnergy.length > 0 ? roundTo(currEnergy[currEnergy.length - 1].fuelDaysRemaining, 1) : null;

    const observations: string[] = [
      `Power generation totaled ${totalGenKwh} kWh against consumption of ${totalConsKwh} kWh, producing a net energy delta of ${netKwh >= 0 ? "+" : ""}${netKwh} kWh.`,
      `Battery State of Charge averaged ${currAvgBattery ?? "N/A"}% (${batteryTrend === "RISING" ? "charging trend" : batteryTrend === "FALLING" ? "discharging trend" : "stable"}).`,
      `There are ${currOpenAlerts} unresolved operational alerts (${criticalAlerts} critical) and ${currOpenIncidents} active incident tickets requiring officer attention.`,
      `Asset health index across ${currEquipment.length} monitored equipment stands at ${currEqHealth ?? "N/A"}%, with ${highRiskEqCount} assets flagged under elevated degradation risk.`,
      `Logistics catalog contains ${currInventory.length} managed SKUs, with ${currCritInv} critical reserve alerts and ${lowStockItems} low stock warnings.`
    ];

    const summary: OperationalSummary = {
      periodLabel: `Last ${params.timeRange || "24 hours"}`,
      stationLabel: stationScope.name,
      generatedAt: new Date().toISOString(),
      dataQuality,
      keyObservations: observations,
      energy: {
        generationKwh: totalGenKwh,
        consumptionKwh: totalConsKwh,
        netKwh,
        batterySocPercent: currAvgBattery,
        fuelAutonomyDays: latestFuelDays
      },
      alerts: {
        total: currAlerts.length,
        open: currOpenAlerts,
        critical: criticalAlerts
      },
      incidents: {
        total: currIncidents.length,
        open: currOpenIncidents
      },
      equipment: {
        monitoredCount: currEquipment.length,
        highRiskCount: highRiskEqCount,
        avgHealthPercent: currEqHealth
      },
      inventory: {
        totalItems: currInventory.length,
        criticalCount: currCritInv,
        lowStockCount: lowStockItems
      }
    };

    return {
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString(),
        timeRange: window.timeRange
      },
      station: stationScope,
      kpiCards,
      summary,
      dataQuality
    };
  }
}

export const analyticsService = new AnalyticsService();
