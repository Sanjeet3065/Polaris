import React from "react";
import { MaintenanceAnalyticsData } from "../../types/analytics.types";
import { Sparkles } from "lucide-react";

interface Props {
  data: MaintenanceAnalyticsData;
  isLoading: boolean;
}

export const MaintenanceAnalyticsSection: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-80 animate-pulse" />
      </div>
    );
  }

  const { summary, riskDistribution, healthDistribution, rulDistribution, predictions } = data;

  const getRiskColor = (band: string) => {
    switch (band) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-400 border-rose-500/40";
      case "HIGH":
        return "bg-orange-500/15 text-orange-400 border-orange-500/40";
      case "MODERATE":
      case "GUARDED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/40";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Advisory Disclaimer Banner */}
      <div className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">
              Phase 10 AI Predictive Maintenance Intelligence
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              AI-assisted prediction • Advisory only
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Predictive values, remaining useful life (RUL) projections, and risk band categorizations are generated
            by deterministic degradation models. Final maintenance interventions remain the responsibility of station
            engineering officers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Total Models</div>
          <div className="text-xl font-bold text-white">{summary.totalPredictions}</div>
          <div className="text-[10px] text-slate-500 mt-1">Degradation baselines</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Avg Risk Score</div>
          <div className="text-xl font-bold text-amber-400">
            {summary.avgRiskScore ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Fleet mean wear index</div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Critical Risk</div>
          <div className="text-xl font-bold text-rose-400">{summary.criticalRiskCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Immediate intervention</div>
        </div>

        <div className="bg-slate-900/90 border border-orange-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">High Risk</div>
          <div className="text-xl font-bold text-orange-400">{summary.highRiskCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Scheduled service alert</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Mean Est. RUL</div>
          <div className="text-xl font-bold text-sky-400">
            {summary.avgRulDays ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Remaining Useful Life</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Work Orders</div>
          <div className="text-xl font-bold text-emerald-400">{summary.workOrdersCreatedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active scheduled tasks</div>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Risk Band Distribution</h4>
          <div className="space-y-2.5">
            {riskDistribution.map((rd) => (
              <div key={rd.band} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{rd.band}</span>
                <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {rd.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Health Score Tiers</h4>
          <div className="space-y-2.5">
            {healthDistribution.map((hd) => (
              <div key={hd.band} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{hd.band}</span>
                <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {hd.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RUL Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Remaining Useful Life (RUL)</h4>
          <div className="space-y-2.5">
            {rulDistribution.map((rul) => (
              <div key={rul.range} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{rul.range}</span>
                <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {rul.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictions Advisory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-1">AI Degradation Forecasts & Advisory Recommendations</h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Machine-generated predictive health indicators and engineering suggestions
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Equipment</th>
                <th className="pb-3 px-3">Station</th>
                <th className="pb-3 px-3">Health</th>
                <th className="pb-3 px-3">Risk Rating</th>
                <th className="pb-3 px-3">Risk Band</th>
                <th className="pb-3 px-3">Est. RUL</th>
                <th className="pb-3 px-3">Advisory Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {predictions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{p.equipmentName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{p.equipmentCode}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-300">{p.stationCode}</td>
                  <td className="py-3 px-3 font-bold text-white">{p.healthScore}%</td>
                  <td className="py-3 px-3 font-bold text-amber-400">{p.riskScore} / 100</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(p.riskBand)}`}>
                      {p.riskBand}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-sky-300">
                    {p.estimatedRulDays ? `${p.estimatedRulDays} days` : "Indeterminate"}
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs">{p.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
