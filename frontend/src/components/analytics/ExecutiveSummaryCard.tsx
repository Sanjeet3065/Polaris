import React from "react";
import { DataQualityReport, OperationalSummary } from "../../types/analytics.types";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Zap, Bell, Wrench, Package } from "lucide-react";

interface Props {
  summary: OperationalSummary;
  dataQuality: DataQualityReport;
}

export const ExecutiveSummaryCard: React.FC<Props> = ({ summary, dataQuality }) => {
  const getQualityBadge = (rating: DataQualityReport["rating"]) => {
    switch (rating) {
      case "GOOD":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
          label: "GOOD (High Density)"
        };
      case "LIMITED":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
          label: "LIMITED (Intermittent Samples)"
        };
      default:
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: AlertCircle,
          label: "POOR (Telemetry Starvation)"
        };
    }
  };

  const qBadge = getQualityBadge(dataQuality.rating);
  const QualityIcon = qBadge.icon;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur mb-6">
      {/* Header with Title and Data Quality Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Executive Operational Intelligence Summary
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
              {summary.periodLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mission briefing for {summary.stationLabel} • Generated deterministically from calibrated telemetry
          </p>
        </div>

        {/* Data Quality Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[10px] uppercase font-bold text-slate-400">Data Coverage</div>
            <div className="text-xs font-semibold text-slate-200">
              {dataQuality.coveragePercent}% ({dataQuality.actualSampleCount} / {dataQuality.expectedSampleCount} samples)
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${qBadge.bg}`}>
            <QualityIcon className="w-4 h-4 shrink-0" />
            <span>{qBadge.label}</span>
          </div>
        </div>
      </div>

      {/* Snapshot High-Level Mini Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Energy Delta</div>
            <div className="text-sm font-bold text-slate-100">
              {summary.energy.netKwh >= 0 ? "+" : ""}
              {summary.energy.netKwh} <span className="text-[10px] font-normal text-slate-400">kWh</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Open Alarms</div>
            <div className="text-sm font-bold text-slate-100">
              {summary.alerts.open} <span className="text-[10px] font-normal text-slate-400">({summary.alerts.critical} crit)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">High-Risk Assets</div>
            <div className="text-sm font-bold text-slate-100">
              {summary.equipment.highRiskCount} <span className="text-[10px] font-normal text-slate-400">of {summary.equipment.monitoredCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Critical Stock Items</div>
            <div className="text-sm font-bold text-slate-100">
              {summary.inventory.criticalCount} <span className="text-[10px] font-normal text-slate-400">SKUs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bullet Observations */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Key Operational Observations & Automated Findings</span>
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {summary.keyObservations.map((obs, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded border border-slate-850">
              <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{obs}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
