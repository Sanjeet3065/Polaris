import {
  GeneratedReport,
  ReportType,
  TimeRangeOption,
  TopKpiCard
} from "./analytics.types";
import { analyticsService } from "./analytics.service";
import { energyAnalyticsService } from "./energyAnalytics.service";
import { environmentAnalyticsService } from "./environmentAnalytics.service";
import { equipmentAnalyticsService } from "./equipmentAnalytics.service";
import { maintenanceAnalyticsService } from "./maintenanceAnalytics.service";
import { alertAnalyticsService } from "./alertAnalytics.service";
import { incidentAnalyticsService } from "./incidentAnalytics.service";
import { logisticsAnalyticsService } from "./logisticsAnalytics.service";
import { stationComparisonService } from "./stationComparison.service";
import { stationService } from "../station.service";
import { ApiError } from "../../utils/apiError";

export interface GenerateReportInput {
  reportType: ReportType;
  stationId?: string;
  timeRange?: TimeRangeOption;
  startDate?: string;
  endDate?: string;
  title?: string;
  authorName?: string;
}

// In-memory persistent cache for generated reports during system runtime
const generatedReportsStore = new Map<string, GeneratedReport>();

/**
 * Mitigates CSV Formula Injection (CWE-1236) by prepending a single quote
 * if a string cell starts with spreadsheet formula trigger characters (=, +, -, @, tab, cr).
 */
function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Escapes HTML characters (&, <, >, ", ') to prevent Cross-Site Scripting (Stored XSS)
 * and HTML injection in generated report documents.
 */
function escapeHtml(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export class ReportService {
  /**
   * Returns metadata about available report templates
   */
  public getReportTypes(): { type: ReportType; title: string; description: string; defaultWindow: string }[] {
    return [
      {
        type: "DAILY_OPERATIONS",
        title: "Daily Station Operations Report",
        description: "24-hour command summary of microgrid, environmental climate, equipment health, and alerts.",
        defaultWindow: "24h"
      },
      {
        type: "WEEKLY_OPERATIONS",
        title: "Weekly Polar Operations Briefing",
        description: "7-day longitudinal review of station autonomy, supply consumption, and maintenance backlog.",
        defaultWindow: "7d"
      },
      {
        type: "ENERGY_ANALYSIS",
        title: "Microgrid & Energy Autonomy Report",
        description: "Detailed diesel vs solar power balance, battery state-of-charge cycling, and fuel burn curves.",
        defaultWindow: "24h"
      },
      {
        type: "ENVIRONMENT_CLIMATE",
        title: "Antarctic Meteorology & Climate Report",
        description: "Atmospheric pressure drops, blizzard threshold events, wind chill, and optical visibility.",
        defaultWindow: "24h"
      },
      {
        type: "EQUIPMENT_HEALTH",
        title: "Fleet Diagnostics & Asset Health Report",
        description: "Mechanical condition monitoring, vibration spectra, and operational wear indices.",
        defaultWindow: "7d"
      },
      {
        type: "ALERTS_INCIDENTS",
        title: "Safety, Alarms & Incident Command Log",
        description: "Historical alert frequency, MTTR/MTTA operational latency, and ticket resolutions.",
        defaultWindow: "7d"
      },
      {
        type: "MAINTENANCE_INTELLIGENCE",
        title: "AI Predictive Maintenance & RUL Report",
        description: "Phase 10 explainable degradation forecasts, remaining useful life estimates, and work orders.",
        defaultWindow: "14d"
      },
      {
        type: "LOGISTICS_INVENTORY",
        title: "Logistics Resupply & Critical Reserves Audit",
        description: "Stock levels across fuel, rations, medical supplies, polar shipping status, and ledger deltas.",
        defaultWindow: "30d"
      },
      {
        type: "STATION_COMPARISON",
        title: "Maitri vs Bharati Comparative Operations Report",
        description: "Objective side-by-side performance benchmarking across both Antarctic research stations.",
        defaultWindow: "24h"
      }
    ];
  }

  /**
   * Generates a structured operational report document
   */
  public async generateReport(input: GenerateReportInput): Promise<GeneratedReport> {
    const reportId = `REP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timeRange = input.timeRange || (input.reportType === "WEEKLY_OPERATIONS" ? "7d" : "24h");
    const author = input.authorName || "Officer of the Watch";

    // 1. Resolve Station
    let station = {
      id: "ALL",
      code: "ALL",
      name: "All Antarctic Stations (Maitri & Bharati)"
    };

    if (input.stationId && input.stationId !== "ALL") {
      const resolved = await stationService.resolveStation(input.stationId);
      station = {
        id: resolved.id,
        code: resolved.code,
        name: resolved.name
      };
    }

    const filter = {
      stationId: input.stationId,
      timeRange,
      startDate: input.startDate,
      endDate: input.endDate
    };

    // 2. Fetch Base Overview Data
    const overview = await analyticsService.getOverview(filter);

    let title = input.title;
    if (!title) {
      const template = this.getReportTypes().find((t) => t.type === input.reportType);
      title = `${template?.title || "POLARIS Operational Report"} — ${station.code}`;
    }

    let executiveSummary = "";
    const keyMetrics: TopKpiCard[] = overview.kpiCards;
    const tables: GeneratedReport["tables"] = [];
    const observations: string[] = [...overview.summary.keyObservations];
    const notes: string[] = [
      "Official publication of National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Govt of India.",
      "Data compiled deterministically from calibrated sensor telemetry and immutable operations logs.",
      "Predictive values are advisory and generated by POLARIS AI predictive algorithms to assist station engineering officers."
    ];

    // 3. Populate Content based on Report Type
    switch (input.reportType) {
      case "DAILY_OPERATIONS":
      case "WEEKLY_OPERATIONS": {
        executiveSummary = `Comprehensive operations briefing for ${station.name} covering the period ${overview.timeWindow.start} to ${overview.timeWindow.end}. Overall station health remains at ${overview.kpiCards[0].currentValue}%. Total energy generation reached ${overview.summary.energy.generationKwh} kWh against a station load of ${overview.summary.energy.consumptionKwh} kWh. There are currently ${overview.summary.alerts.open} active alerts and ${overview.summary.incidents.open} open incident command tickets.`;

        // Energy overview table
        const energyData = await energyAnalyticsService.getEnergyAnalytics(filter);
        tables.push({
          name: "Microgrid Energy Performance",
          columns: ["Metric", "Value", "Unit"],
          rows: [
            ["Total Generation", energyData.metrics.totalGenerationKwh, "kWh"],
            ["Total Consumption", energyData.metrics.totalConsumptionKwh, "kWh"],
            ["Net Energy Delta", energyData.metrics.netEnergyKwh, "kWh"],
            ["Average Battery State of Charge", energyData.metrics.avgBatteryPercent ?? "N/A", "%"],
            ["Fuel Autonomy Remaining", energyData.metrics.fuelDaysRemaining ?? "N/A", "days"]
          ]
        });

        // Equipment table
        const eqData = await equipmentAnalyticsService.getEquipmentAnalytics(filter);
        tables.push({
          name: "Critical Asset Condition Summary",
          columns: ["Equipment Code", "Name", "Category", "Health", "Risk Band", "Open Alerts"],
          rows: eqData.equipment.slice(0, 8).map((e) => [
            e.code,
            e.name,
            e.category,
            `${e.healthPercent}%`,
            e.riskBand || "LOW",
            e.alertCount
          ])
        });
        break;
      }

      case "ENERGY_ANALYSIS": {
        const energyData = await energyAnalyticsService.getEnergyAnalytics(filter);
        executiveSummary = `Dedicated energy audit for ${station.name}. Power generated: ${energyData.metrics.totalGenerationKwh} kWh. Total load consumed: ${energyData.metrics.totalConsumptionKwh} kWh. Solar contribution accounted for ${energyData.metrics.solarFractionPercent ?? 0}% of gross microgrid output. Generator utilization averaged ${energyData.metrics.generatorUtilizationPercent ?? 0}%. Current fuel reserves stand at ${energyData.metrics.fuelDaysRemaining ?? "N/A"} days of mission autonomy.`;

        tables.push({
          name: "Microgrid Energy Balance",
          columns: ["Parameter", "Calculated Value", "Unit"],
          rows: [
            ["Peak Generation Observed", energyData.metrics.peakGenerationKw, "kW"],
            ["Average Continuous Generation", energyData.metrics.avgGenerationKw, "kW"],
            ["Peak Station Load", energyData.metrics.peakConsumptionKw, "kW"],
            ["Average Continuous Load", energyData.metrics.avgConsumptionKw, "kW"],
            ["Net Power Delta", energyData.metrics.netPowerKw, "kW"],
            ["Solar Photovoltaic Output", energyData.metrics.solarGenerationKwh, "kWh"],
            ["Battery Reserve (Min / Avg / Max)", `${energyData.metrics.minBatteryPercent ?? 0}% / ${energyData.metrics.avgBatteryPercent ?? 0}% / ${energyData.metrics.maxBatteryPercent ?? 0}%`, "%"],
            ["Bulk Fuel Storage Reserves", energyData.metrics.fuelLiters ? `${energyData.metrics.fuelLiters} L` : "N/A", "Liters"]
          ]
        });
        break;
      }

      case "ENVIRONMENT_CLIMATE": {
        const envData = await environmentAnalyticsService.getEnvironmentAnalytics(filter);
        executiveSummary = `Meteorological and microclimate summary for ${station.name}. Ambient temperature averaged ${envData.metrics.avgTemperature ?? "N/A"}°C with recorded minimum of ${envData.metrics.minTemperature ?? "N/A"}°C. Sustained wind speeds averaged ${envData.metrics.avgWindSpeed ?? "N/A"} km/h with peak gusts reaching ${envData.metrics.maxWindSpeed ?? "N/A"} km/h. Sensor telemetry logged ${envData.thresholdExceedances.blizzardConditionEvents} blizzard threshold conditions and ${envData.thresholdExceedances.extremeColdEvents} extreme cold excursions.`;

        tables.push({
          name: "Atmospheric Sensor Observations",
          columns: ["Atmospheric Parameter", "Average", "Minimum", "Maximum", "Unit"],
          rows: [
            ["Ambient Temperature", envData.metrics.avgTemperature ?? "N/A", envData.metrics.minTemperature ?? "N/A", envData.metrics.maxTemperature ?? "N/A", "°C"],
            ["Wind Velocity", envData.metrics.avgWindSpeed ?? "N/A", 0, envData.metrics.maxWindSpeed ?? "N/A", "km/h"],
            ["Barometric Pressure", envData.metrics.avgPressure ?? "N/A", envData.metrics.minPressure ?? "N/A", envData.metrics.maxPressure ?? "N/A", "hPa"],
            ["Relative Humidity", envData.metrics.avgHumidity ?? "N/A", "N/A", "N/A", "%"],
            ["Optical Visibility", envData.metrics.avgVisibility ?? "N/A", "N/A", "N/A", "km"]
          ]
        });

        tables.push({
          name: "Severe Weather Threshold Exceedances",
          columns: ["Condition Type", "Trigger Criteria", "Logged Exceedances"],
          rows: [
            ["Blizzard Conditions", "Wind > 70 km/h AND Visibility < 1 km", envData.thresholdExceedances.blizzardConditionEvents],
            ["Extreme Cold Excursion", "Ambient Temperature < -40.0°C", envData.thresholdExceedances.extremeColdEvents],
            ["Gale / High Wind Alert", "Wind Velocity > 60.0 km/h", envData.thresholdExceedances.highWindEvents],
            ["Deep Low Pressure Drop", "Barometric Pressure < 970.0 hPa", envData.thresholdExceedances.lowPressureEvents]
          ]
        });
        break;
      }

      case "EQUIPMENT_HEALTH": {
        const eqData = await equipmentAnalyticsService.getEquipmentAnalytics(filter);
        executiveSummary = `Machinery fleet integrity report. Monitored ${eqData.summary.totalMonitored} assets with an average operational health index of ${eqData.summary.avgHealthScore}%. Current status: ${eqData.summary.healthyCount} assets in optimal health, ${eqData.summary.degradedCount} assets showing degraded wear signatures, and ${eqData.summary.criticalCount} machinery units under critical maintenance alert.`;

        tables.push({
          name: "Asset Diagnostic Registry",
          columns: ["Equipment Code", "Name", "Category", "Health", "Status", "Alerts", "Incidents"],
          rows: eqData.equipment.map((e) => [
            e.code,
            e.name,
            e.category,
            `${e.healthPercent}%`,
            e.status,
            e.alertCount,
            e.incidentCount
          ])
        });
        break;
      }

      case "ALERTS_INCIDENTS": {
        const alertData = await alertAnalyticsService.getAlertAnalytics(filter);
        const incidentData = await incidentAnalyticsService.getIncidentAnalytics(filter);
        executiveSummary = `Safety, alarms, and emergency incident operations report. Total alerts recorded: ${alertData.summary.totalAlerts}, with ${alertData.summary.openAlerts} remaining open. Mean Time to Acknowledge (MTTA): ${alertData.summary.mttaMinutes ? `${alertData.summary.mttaMinutes} min` : "N/A"}. Total incident command tickets: ${incidentData.summary.totalIncidents} (${incidentData.summary.openIncidents} active). Average incident resolution time: ${incidentData.summary.avgResolutionHours ? `${incidentData.summary.avgResolutionHours} hrs` : "N/A"}.`;

        tables.push({
          name: "Top Recurring Alarm Rules",
          columns: ["Rule Code", "Alarm Title", "Severity", "Occurrence Count"],
          rows: alertData.topRules.map((r) => [r.ruleCode, r.title, r.severity, r.count])
        });

        tables.push({
          name: "Active Incident Command Logs",
          columns: ["Incident #", "Title", "Severity", "Status", "Category", "Started At"],
          rows: incidentData.recentIncidents.map((i) => [
            i.incidentNumber,
            i.title,
            i.severity,
            i.status,
            i.category,
            i.startedAt
          ])
        });
        break;
      }

      case "MAINTENANCE_INTELLIGENCE": {
        const maintData = await maintenanceAnalyticsService.getMaintenanceAnalytics(filter);
        executiveSummary = `Phase 10 AI-assisted predictive maintenance analysis. Total active degradation models: ${maintData.summary.totalPredictions}. Fleet average risk rating: ${maintData.summary.avgRiskScore ?? "N/A"}/100. Critical risk assets flagged: ${maintData.summary.criticalRiskCount}. High risk assets: ${maintData.summary.highRiskCount}. Mean Remaining Useful Life (RUL) across flagged assets: ${maintData.summary.avgRulDays ?? "N/A"} days. A total of ${maintData.summary.workOrdersCreatedCount} work orders are scheduled.`;

        tables.push({
          name: "AI Predictive Maintenance Advisory Table",
          columns: ["Equipment", "Health Score", "Risk Score", "Risk Band", "Est. RUL", "Engineering Recommendation"],
          rows: maintData.predictions.map((p) => [
            `${p.equipmentCode} (${p.equipmentName})`,
            `${p.healthScore}%`,
            `${p.riskScore}/100`,
            p.riskBand,
            p.estimatedRulDays ? `${p.estimatedRulDays} days` : "Indeterminate",
            p.recommendation
          ])
        });
        break;
      }

      case "LOGISTICS_INVENTORY": {
        const logData = await logisticsAnalyticsService.getLogisticsAnalytics(filter);
        executiveSummary = `Polar supply chain, inventory, and resupply voyages audit. Total managed items: ${logData.summary.totalItems}. Critical stock reserve shortages: ${logData.summary.criticalStockItems}. Total supply movement transactions: ${logData.summary.totalMovements}. Total polar resupply voyages tracked: ${logData.summary.totalShipments}.`;

        tables.push({
          name: "Inventory Category Allocation",
          columns: ["Category", "Catalog Items", "Total Quantity In-Stock", "Critical Reserve Shortages"],
          rows: logData.categoryDistribution.map((c) => [
            c.category,
            c.itemCount,
            c.totalQuantity,
            c.criticalCount
          ])
        });

        tables.push({
          name: "Recent Stock Ledger Movements",
          columns: ["Item Name", "SKU", "Movement Type", "Quantity Delta", "Resulting Stock"],
          rows: logData.recentMovements.map((m) => [
            m.itemName,
            m.sku,
            m.type,
            m.quantity,
            m.newStock
          ])
        });
        break;
      }

      case "STATION_COMPARISON": {
        const compData = await stationComparisonService.getStationComparison(filter);
        executiveSummary = `Side-by-side comparative operational analysis between Indian Antarctic Research Stations Maitri and Bharati. Maitri is operating at ${compData.stations.find((s) => s.code === "MAITRI")?.healthPercent ?? "N/A"}% health index; Bharati is operating at ${compData.stations.find((s) => s.code === "BHARATI")?.healthPercent ?? "N/A"}% health index. Data indicates distinct microclimate and power consumption profiles reflecting their respective geographical locations (Schirmacher Oasis vs Larsemann Hills).`;

        tables.push({
          name: "Maitri vs Bharati Operational Benchmark Table",
          columns: ["Operational Dimension", "Unit", "Maitri Station", "Bharati Station", "Technical Note"],
          rows: compData.comparisonTable.map((row) => [
            row.metric,
            row.unit,
            row.maitriValue ?? "N/A",
            row.bharatiValue ?? "N/A",
            row.note
          ])
        });
        break;
      }
    }

    const report: GeneratedReport = {
      id: reportId,
      reportType: input.reportType,
      title,
      station,
      generatedAt: new Date().toISOString(),
      generatedBy: author,
      period: {
        start: overview.timeWindow.start,
        end: overview.timeWindow.end,
        label: overview.summary.periodLabel
      },
      dataQuality: overview.dataQuality,
      executiveSummary,
      keyMetrics,
      tables,
      observations,
      notes
    };

    // Store in memory for later retrieval or export
    generatedReportsStore.set(reportId, report);

    return report;
  }

  /**
   * Retrieves a previously generated report by ID
   */
  public async getReportById(reportId: string): Promise<GeneratedReport> {
    const report = generatedReportsStore.get(reportId);
    if (!report) {
      throw ApiError.notFound(`Report with ID '${reportId}' was not found.`, "REPORT_NOT_FOUND");
    }
    return report;
  }

  /**
   * Lists all generated reports in cache
   */
  public async listGeneratedReports(): Promise<GeneratedReport[]> {
    return Array.from(generatedReportsStore.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  /**
   * Formats report content into standard RFC 4180 CSV with injection sanitization
   */
  public exportToCsv(report: GeneratedReport): string {
    const lines: string[] = [];

    // Header metadata
    lines.push(`"POLARIS POLAR OPERATIONS REPORT"`);
    lines.push(`"Title",${sanitizeCsvCell(report.title)}`);
    lines.push(`"Report ID",${sanitizeCsvCell(report.id)}`);
    lines.push(`"Station",${sanitizeCsvCell(`${report.station.name} (${report.station.code})`)}`);
    lines.push(`"Date Range",${sanitizeCsvCell(`${report.period.start} to ${report.period.end}`)}`);
    lines.push(`"Generated By",${sanitizeCsvCell(report.generatedBy)}`);
    lines.push(`"Generated At",${sanitizeCsvCell(report.generatedAt)}`);
    lines.push(`"Data Quality",${sanitizeCsvCell(`${report.dataQuality.rating} (${report.dataQuality.coveragePercent}% coverage)`)}`);
    lines.push("");

    // Executive summary
    lines.push(`"EXECUTIVE SUMMARY"`);
    lines.push(sanitizeCsvCell(report.executiveSummary));
    lines.push("");

    // KPIs section
    lines.push(`"KEY OPERATIONAL METRICS"`);
    lines.push(`"Metric","Current Value","Previous Value","Unit","Change %","Trend","Status"`);
    for (const kpi of report.keyMetrics) {
      lines.push(
        [
          sanitizeCsvCell(kpi.label),
          sanitizeCsvCell(kpi.currentValue ?? "N/A"),
          sanitizeCsvCell(kpi.previousValue ?? "N/A"),
          sanitizeCsvCell(kpi.unit),
          sanitizeCsvCell(kpi.changePercent !== null ? `${kpi.changePercent}%` : "N/A"),
          sanitizeCsvCell(kpi.trend),
          sanitizeCsvCell(kpi.status)
        ].join(",")
      );
    }
    lines.push("");

    // Data tables
    for (const table of report.tables) {
      lines.push(sanitizeCsvCell(table.name.toUpperCase()));
      lines.push(table.columns.map((c) => sanitizeCsvCell(c)).join(","));
      for (const row of table.rows) {
        lines.push(row.map((val) => sanitizeCsvCell(val)).join(","));
      }
      lines.push("");
    }

    return lines.join("\r\n");
  }

  /**
   * Generates a clean, print-friendly HTML document with dark POLARIS aesthetics and XSS escaping
   */
  public exportToHtml(report: GeneratedReport): string {
    const kpiRows = report.keyMetrics
      .map(
        (kpi) => `
        <div class="kpi-card">
          <div class="kpi-label">${escapeHtml(kpi.label)}</div>
          <div class="kpi-val">${escapeHtml(kpi.currentValue ?? "N/A")} <span class="kpi-unit">${escapeHtml(kpi.unit)}</span></div>
          <div class="kpi-trend ${kpi.trend === "RISING" ? "trend-up" : kpi.trend === "FALLING" ? "trend-down" : "trend-stable"}">
            ${kpi.changePercent !== null ? (kpi.changePercent > 0 ? "+" : "") + escapeHtml(kpi.changePercent) + "%" : "Stable"} (${escapeHtml(kpi.trend)})
          </div>
        </div>
      `
      )
      .join("");

    const tableHtml = report.tables
      .map(
        (tbl) => `
        <div class="table-section">
          <h3>${escapeHtml(tbl.name)}</h3>
          <table>
            <thead>
              <tr>${tbl.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tbl.rows
                .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? "—")}</td>`).join("")}</tr>`)
                .join("")}
            </tbody>
          </table>
        </div>
      `
      )
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #cbd5e1; margin: 0; padding: 30px; line-height: 1.5; }
    .header { border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.1em; }
    h1 { color: #f8fafc; font-size: 22px; margin: 4px 0 10px 0; }
    .meta { font-size: 12px; color: #64748b; display: flex; gap: 20px; flex-wrap: wrap; }
    .summary-box { background: #0f172a; border-left: 4px solid #38bdf8; padding: 14px 18px; margin-bottom: 24px; border-radius: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 30px; }
    .kpi-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; }
    .kpi-label { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
    .kpi-val { font-size: 20px; font-weight: 700; color: #f8fafc; }
    .kpi-unit { font-size: 12px; font-weight: 400; color: #64748b; }
    .kpi-trend { font-size: 11px; margin-top: 4px; }
    .trend-up { color: #38bdf8; }
    .trend-down { color: #f59e0b; }
    .trend-stable { color: #94a3b8; }
    .table-section { margin-bottom: 30px; }
    h3 { color: #e2e8f0; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; background: #0f172a; }
    th { background: #1e293b; color: #94a3b8; text-align: left; padding: 8px 12px; font-weight: 600; }
    td { padding: 8px 12px; border-top: 1px solid #1e293b; color: #cbd5e1; }
    .notes-box { font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 30px; }
    @media print {
      body { background: #ffffff; color: #0f172a; padding: 10px; }
      .kpi-card, table, .summary-box { background: #ffffff; border-color: #cbd5e1; color: #0f172a; }
      th { background: #f1f5f9; color: #334155; }
      td { border-color: #e2e8f0; color: #0f172a; }
      h1, .kpi-val, h3 { color: #0f172a; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">POLARIS — Indian Antarctic Research Programme • MoES / NCPOR</div>
    <h1>${escapeHtml(report.title)}</h1>
    <div class="meta">
      <div><strong>Report ID:</strong> ${escapeHtml(report.id)}</div>
      <div><strong>Station:</strong> ${escapeHtml(report.station.name)} (${escapeHtml(report.station.code)})</div>
      <div><strong>Period:</strong> ${escapeHtml(report.period.start)} → ${escapeHtml(report.period.end)}</div>
      <div><strong>Generated By:</strong> ${escapeHtml(report.generatedBy)}</div>
      <div><strong>Data Quality:</strong> ${escapeHtml(report.dataQuality.rating)} (${escapeHtml(report.dataQuality.coveragePercent)}% coverage)</div>
    </div>
  </div>

  <div class="summary-box">
    <strong>Executive Operations Summary:</strong><br/>
    ${escapeHtml(report.executiveSummary)}
  </div>

  <div class="kpi-grid">
    ${kpiRows}
  </div>

  ${tableHtml}

  <div class="notes-box">
    <strong>Governance & Compliance Notes:</strong><br/>
    ${report.notes.map((n) => `• ${escapeHtml(n)}<br/>`).join("")}
  </div>
</body>
</html>`;
  }
}

export const reportService = new ReportService();
