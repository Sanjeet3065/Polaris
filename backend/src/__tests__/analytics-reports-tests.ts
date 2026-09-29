import { analyticsService } from "../services/analytics/analytics.service";
import { energyAnalyticsService } from "../services/analytics/energyAnalytics.service";
import { environmentAnalyticsService } from "../services/analytics/environmentAnalytics.service";
import { equipmentAnalyticsService } from "../services/analytics/equipmentAnalytics.service";
import { maintenanceAnalyticsService } from "../services/analytics/maintenanceAnalytics.service";
import { alertAnalyticsService } from "../services/analytics/alertAnalytics.service";
import { incidentAnalyticsService } from "../services/analytics/incidentAnalytics.service";
import { logisticsAnalyticsService } from "../services/analytics/logisticsAnalytics.service";
import { stationComparisonService } from "../services/analytics/stationComparison.service";
import { reportService } from "../services/analytics/report.service";
import {
  calculateAverage,
  calculateChangePercent,
  calculateSum,
  calculateTrend,
  evaluateDataQuality,
  resolveTimeWindow
} from "../services/analytics/analyticsUtils";
import { prisma } from "../config/prisma";

interface TestReport {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestReport[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✔ PASS: ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  ❌ FAIL: ${name} -> ${errorMsg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

export async function runAnalyticsReportsTests() {
  console.log("\n=================================================");
  console.log("POLARIS Phase 11: Analytics & Reports Test Suite");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // Group 1: Mathematical Utilities & Time Window Parsing
  // -----------------------------------------------------------------
  console.log("--- Group 1: Mathematical Utilities & Time Windows ---");

  await test("resolveTimeWindow calculates exact 24h window and previous period", async () => {
    const window = resolveTimeWindow({ timeRange: "24h" });
    const diffHours = (window.currentEnd.getTime() - window.currentStart.getTime()) / (1000 * 60 * 60);
    assert(Math.round(diffHours) === 24, "Expected duration to be 24 hours");

    const prevDuration = window.previousEnd.getTime() - window.previousStart.getTime();
    assert(prevDuration === window.durationMs, "Previous duration must match current duration exactly");
    assert(window.previousEnd.getTime() === window.currentStart.getTime(), "Previous end must equal current start");
  });

  await test("resolveTimeWindow validates custom date boundaries", async () => {
    const start = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date().toISOString();

    const window = resolveTimeWindow({
      timeRange: "custom",
      startDate: start,
      endDate: end
    });
    assert(window.currentStart.toISOString() === new Date(start).toISOString(), "Start date mismatch");
    assert(window.currentEnd.toISOString() === new Date(end).toISOString(), "End date mismatch");
  });

  await test("resolveTimeWindow rejects invalid custom date order (start >= end)", async () => {
    let threw = false;
    try {
      resolveTimeWindow({
        timeRange: "custom",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() - 3600000).toISOString()
      });
    } catch (e: any) {
      threw = true;
      assert(e.code === "INVALID_DATE_ORDER", "Expected INVALID_DATE_ORDER error code");
    }
    assert(threw, "Expected error when start >= end");
  });

  await test("Mathematical formulas: percentage change, sum, average, trend", async () => {
    // Percentage change: ((220 - 200) / 200) * 100 = 10%
    const change = calculateChangePercent(220, 200);
    assert(change === 10, `Expected 10%, got ${change}`);

    // Negative change: ((90 - 100) / 100) * 100 = -10%
    const negChange = calculateChangePercent(90, 100);
    assert(negChange === -10, `Expected -10%, got ${negChange}`);

    // Directional trend
    assert(calculateTrend(110, 100) === "RISING", "Expected RISING trend");
    assert(calculateTrend(90, 100) === "FALLING", "Expected FALLING trend");
    assert(calculateTrend(100.2, 100) === "STABLE", "Expected STABLE trend");

    // Sum & Average
    const numbers = [100, 200, 300];
    assert(calculateSum(numbers) === 600, "Sum must be 600");
    assert(calculateAverage(numbers) === 200, "Average must be 200");
  });

  await test("evaluateDataQuality produces correct rating tiers", async () => {
    // 24 hours at 5 min nominal = 288 samples
    const goodQuality = evaluateDataQuality(280, 5, 24);
    assert(goodQuality.rating === "GOOD", "Expected GOOD data quality rating");

    const limitedQuality = evaluateDataQuality(180, 5, 24);
    assert(limitedQuality.rating === "LIMITED", "Expected LIMITED data quality rating");

    const poorQuality = evaluateDataQuality(50, 5, 24);
    assert(poorQuality.rating === "POOR", "Expected POOR data quality rating");
  });

  // -----------------------------------------------------------------
  // Group 2: Executive Overview & Top 10 KPIs
  // -----------------------------------------------------------------
  console.log("\n--- Group 2: Executive Overview Analytics ---");

  await test("analyticsService.getOverview returns all 10 standard KPI cards", async () => {
    const overview = await analyticsService.getOverview({ timeRange: "24h" });

    assert(overview.kpiCards.length === 10, `Expected 10 KPI cards, got ${overview.kpiCards.length}`);

    const expectedKeys = [
      "station_health",
      "power_generation",
      "power_consumption",
      "battery_soc",
      "fuel_reserve",
      "equipment_health",
      "open_alerts",
      "open_incidents",
      "maintenance_risk",
      "critical_inventory"
    ];

    for (const key of expectedKeys) {
      const found = overview.kpiCards.find((c) => c.key === key);
      assert(found !== undefined, `Missing KPI card: ${key}`);
      assert(found?.label !== undefined, `KPI ${key} missing label`);
      assert(found?.unit !== undefined, `KPI ${key} missing unit`);
      assert(found?.trend !== undefined, `KPI ${key} missing trend indicator`);
    }

    assert(overview.summary.keyObservations.length >= 3, "Expected at least 3 deterministic key observations");
    assert(overview.dataQuality !== undefined, "Expected data quality assessment");
  });

  await test("analyticsService.getOverview filters by specific station", async () => {
    const maitriOverview = await analyticsService.getOverview({
      stationId: "MAITRI",
      timeRange: "24h"
    });
    assert(maitriOverview.station.code === "MAITRI", "Expected station code to be MAITRI");

    const bharatiOverview = await analyticsService.getOverview({
      stationId: "BHARATI",
      timeRange: "24h"
    });
    assert(bharatiOverview.station.code === "BHARATI", "Expected station code to be BHARATI");
  });

  // -----------------------------------------------------------------
  // Group 3: Energy & Environmental Analytics
  // -----------------------------------------------------------------
  console.log("\n--- Group 3: Energy & Environmental Analytics ---");

  await test("energyAnalyticsService returns mathematical power balance and telemetry", async () => {
    const energy = await energyAnalyticsService.getEnergyAnalytics({ timeRange: "24h" });

    assert(typeof energy.metrics.totalGenerationKwh === "number", "Expected numeric generation");
    assert(typeof energy.metrics.totalConsumptionKwh === "number", "Expected numeric consumption");
    assert(typeof energy.metrics.netPowerKw === "number", "Expected numeric net power");
    assert(Array.isArray(energy.timeSeries), "Expected timeSeries array");

    // Net power mathematical check: netPowerKw = avgGen - avgCons
    const expectedNet = Math.round((energy.metrics.avgGenerationKw - energy.metrics.avgConsumptionKw) * 10) / 10;
    assert(
      Math.abs(energy.metrics.netPowerKw - expectedNet) <= 0.2,
      `Net power mismatch: ${energy.metrics.netPowerKw} vs expected ${expectedNet}`
    );
  });

  await test("environmentAnalyticsService returns meteorological data and threshold events", async () => {
    const env = await environmentAnalyticsService.getEnvironmentAnalytics({ timeRange: "24h" });

    assert(env.metrics !== undefined, "Missing environment metrics");
    assert(typeof env.thresholdExceedances.blizzardConditionEvents === "number", "Expected blizzard event count");
    assert(typeof env.thresholdExceedances.extremeColdEvents === "number", "Expected extreme cold event count");
    assert(Array.isArray(env.timeSeries), "Expected environment timeSeries array");
  });

  // -----------------------------------------------------------------
  // Group 4: Equipment & Phase 10 Maintenance Analytics
  // -----------------------------------------------------------------
  console.log("\n--- Group 4: Equipment & Maintenance Analytics ---");

  await test("equipmentAnalyticsService aggregates machinery fleet health", async () => {
    const eq = await equipmentAnalyticsService.getEquipmentAnalytics({ timeRange: "7d" });

    assert(eq.summary.totalMonitored > 0, "Expected monitored equipment count > 0");
    assert(eq.equipment.length > 0, "Expected equipment items");
    assert(eq.healthDistribution.length === 4, "Expected 4 health bands");
  });

  await test("maintenanceAnalyticsService consumes Phase 10 prediction data and risk bands", async () => {
    const maint = await maintenanceAnalyticsService.getMaintenanceAnalytics({ timeRange: "30d" });

    assert(typeof maint.summary.criticalRiskCount === "number", "Expected numeric critical risk count");
    assert(typeof maint.summary.highRiskCount === "number", "Expected numeric high risk count");
    assert(Array.isArray(maint.riskDistribution), "Expected risk distribution array");
    assert(Array.isArray(maint.rulDistribution), "Expected RUL distribution array");
  });

  // -----------------------------------------------------------------
  // Group 5: Alerts, Incidents & Logistics Analytics
  // -----------------------------------------------------------------
  console.log("\n--- Group 5: Alerts, Incidents & Logistics ---");

  await test("alertAnalyticsService aggregates alert lifecycle and recurrence", async () => {
    const alerts = await alertAnalyticsService.getAlertAnalytics({ timeRange: "7d" });

    assert(typeof alerts.summary.totalAlerts === "number", "Expected numeric total alerts");
    assert(typeof alerts.summary.openAlerts === "number", "Expected numeric open alerts");
    assert(alerts.bySeverity.CRITICAL !== undefined, "Expected CRITICAL severity count");
    assert(Array.isArray(alerts.topRules), "Expected topRules array");
  });

  await test("incidentAnalyticsService aggregates incident command tickets and MTTR", async () => {
    const incidents = await incidentAnalyticsService.getIncidentAnalytics({ timeRange: "7d" });

    assert(typeof incidents.summary.totalIncidents === "number", "Expected numeric total incidents");
    assert(incidents.bySeverity !== undefined, "Expected severity breakdown");
    assert(incidents.byCategory !== undefined, "Expected category breakdown");
  });

  await test("logisticsAnalyticsService reads immutable ledger and inventory items", async () => {
    const log = await logisticsAnalyticsService.getLogisticsAnalytics({ timeRange: "30d" });

    assert(log.summary.totalItems > 0, "Expected inventory items count > 0");
    assert(Array.isArray(log.categoryDistribution), "Expected category distribution");
    assert(Array.isArray(log.recentMovements), "Expected recent movements ledger");
  });

  // -----------------------------------------------------------------
  // Group 6: Station Comparison (Maitri vs Bharati)
  // -----------------------------------------------------------------
  console.log("\n--- Group 6: Station Comparison ---");

  await test("stationComparisonService provides side-by-side benchmark without false winners", async () => {
    const comp = await stationComparisonService.getStationComparison({ timeRange: "24h" });

    assert(comp.stations.length === 2, `Expected 2 stations, got ${comp.stations.length}`);
    const codes = comp.stations.map((s) => s.code);
    assert(codes.includes("MAITRI") && codes.includes("BHARATI"), "Must include both MAITRI and BHARATI");

    assert(comp.comparisonTable.length >= 10, "Expected at least 10 comparative metrics in table");
    for (const row of comp.comparisonTable) {
      assert(row.metric !== undefined, "Comparison row missing metric");
      assert(row.maitriValue !== undefined, "Comparison row missing Maitri value");
      assert(row.bharatiValue !== undefined, "Comparison row missing Bharati value");
    }
  });

  // -----------------------------------------------------------------
  // Group 7: Reports Generation & Export
  // -----------------------------------------------------------------
  console.log("\n--- Group 7: Reports Generation & Export ---");

  await test("reportService lists all 9 supported report types", async () => {
    const types = reportService.getReportTypes();
    assert(types.length === 9, `Expected 9 report types, got ${types.length}`);
  });

  await test("reportService generates a Daily Operations Report", async () => {
    const report = await reportService.generateReport({
      reportType: "DAILY_OPERATIONS",
      stationId: "MAITRI",
      timeRange: "24h",
      authorName: "Station Commander"
    });

    assert(report.id.startsWith("REP-"), "Expected report ID to begin with REP-");
    assert(report.station.code === "MAITRI", "Expected MAITRI station");
    assert(report.keyMetrics.length > 0, "Expected KPI metrics in report");
    assert(report.tables.length > 0, "Expected data tables in report");
    assert(report.executiveSummary.length > 20, "Expected meaningful executive summary");

    // Fetch by ID
    const retrieved = await reportService.getReportById(report.id);
    assert(retrieved.id === report.id, "Retrieved report ID mismatch");
  });

  await test("reportService exports report to valid RFC 4180 CSV", async () => {
    const report = await reportService.generateReport({
      reportType: "ENERGY_ANALYSIS",
      stationId: "BHARATI",
      timeRange: "24h"
    });

    const csv = reportService.exportToCsv(report);
    assert(typeof csv === "string", "Expected CSV string output");
    assert(csv.includes("POLARIS POLAR OPERATIONS REPORT"), "CSV missing header banner");
    assert(csv.includes("KEY OPERATIONAL METRICS"), "CSV missing KPI section");
    assert(csv.includes("MICROGRID ENERGY BALANCE"), "CSV missing energy table");
  });

  await test("reportService exports report to print-ready HTML", async () => {
    const report = await reportService.generateReport({
      reportType: "STATION_COMPARISON",
      timeRange: "24h"
    });

    const html = reportService.exportToHtml(report);
    assert(typeof html === "string", "Expected HTML string output");
    assert(html.includes("<!DOCTYPE html>"), "HTML missing doctype");
    assert(html.includes("POLARIS"), "HTML missing POLARIS branding");
    assert(html.includes("Executive Operations Summary"), "HTML missing executive summary");
  });

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n=================================================`);
  console.log(`Phase 11 Test Execution Summary: ${passed}/${results.length} Passed (${failed} Failed)`);
  console.log(`=================================================\n`);

  if (failed > 0) {
    throw new Error(`${failed} Phase 11 tests failed.`);
  }
}
