import React, { useState } from "react";
import { ContributingFactor, DetailedPredictionView } from "../../types/maintenance.types";
import {
  AlertTriangle,
  ExternalLink,
  Info,
  RotateCw,
  Wrench,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { Link } from "react-router-dom";

interface Props {
  detail: DetailedPredictionView | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: (equipmentId: string) => void;
  isRefreshing: boolean;
  onOpenWorkOrderModal: (equipmentId: string, equipmentCode: string) => void;
}

export const PredictionDetailDrawer: React.FC<Props> = ({
  detail,
  isOpen,
  onClose,
  onRefresh,
  isRefreshing,
  onOpenWorkOrderModal
}) => {
  const [activeTab, setActiveTab] = useState<"factors" | "trends" | "telemetry" | "safety" | "history">("factors");

  if (!isOpen || !detail) return null;

  const { prediction, equipment, relatedAlerts, relatedIncidents, maintenanceHistory, healthHistory, riskTrend } = detail;

  let factors: ContributingFactor[] = [];
  try {
    factors = typeof prediction.topFactors === "string" ? JSON.parse(prediction.topFactors) : prediction.topFactors;
  } catch {
    factors = [];
  }

  // Format chart time
  const formattedRiskTrend = riskTrend.map((r) => ({
    time: new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Risk: r.riskScore,
    Health: r.healthScore
  }));

  const formattedTelemetry = healthHistory.map((h) => ({
    time: new Date(h.recordedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    Temp: h.temperature ?? 0,
    Vibration: h.vibration ?? 0,
    Health: h.healthScore
  }));

  const getRiskColor = (band: string) => {
    switch (band) {
      case "CRITICAL":
        return "text-rose-400 border-rose-500/40 bg-rose-500/10";
      case "HIGH":
        return "text-orange-400 border-orange-500/40 bg-orange-500/10";
      case "MODERATE":
        return "text-amber-400 border-amber-500/40 bg-amber-500/10";
      case "GUARDED":
        return "text-blue-400 border-blue-500/40 bg-blue-500/10";
      default:
        return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "LOW":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
                  {equipment.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {equipment.stationCode}
                </span>
                <span className="text-xs text-slate-400">
                  {equipment.category.replace(/_/g, " ")}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {equipment.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close detail drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-4 gap-2.5 mt-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Health Score</span>
              <span className="text-xl font-bold text-white">{prediction.healthScore}%</span>
            </div>

            <div className={`border rounded-lg p-2.5 ${getRiskColor(prediction.riskBand)}`}>
              <span className="text-[10px] font-medium uppercase tracking-wider block">Risk Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{prediction.riskScore}%</span>
                <span className="text-[10px] font-semibold">({prediction.riskBand})</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Estimated RUL</span>
              <span className="text-xl font-bold text-cyan-300">
                {prediction.estimatedRulDays != null ? `${prediction.estimatedRulDays}d` : "Stable"}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Confidence</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-200">{prediction.confidence}%</span>
                <span className="text-[9px] uppercase font-bold text-emerald-400">{prediction.dataQuality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advisory Recommendation Box */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
            <Wrench className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Engineering Advisory Recommendation
              </h4>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {prediction.recommendation}
              </p>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Advisory only. Final operational intervention remains with station engineering officers.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-900 flex gap-2">
          {[
            { id: "factors", label: "Explainability Factors" },
            { id: "trends", label: "Risk & Health Trends" },
            { id: "telemetry", label: "Sensor Signals" },
            { id: "safety", label: `Alerts (${relatedAlerts.length})` },
            { id: "history", label: `Maintenance (${maintenanceHistory.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 space-y-4">
          {/* TAB 1: EXPLAINABILITY FACTORS */}
          {activeTab === "factors" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Top Contributing Risk Drivers
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Model: {prediction.modelName} (v{prediction.modelVersion})
                </span>
              </div>

              {factors.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs border border-slate-800 rounded-lg">
                  No abnormal risk drivers detected. System operating within nominal polar boundaries.
                </div>
              ) : (
                factors.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {idx + 1}. {f.factor}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {f.category}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(f.severity)}`}>
                        {f.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {f.description}
                    </p>

                    {/* Impact Bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase font-medium">Impact:</span>
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${Math.min(100, f.impactPercent)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                        {f.impactPercent}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: RISK & HEALTH TREND CHART */}
          {activeTab === "trends" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Longitudinal Degradation Trend
              </h3>
              <p className="text-xs text-slate-400">
                Reveals equipment health decay and progressive risk accumulation over historical observation cycles.
              </p>

              <div className="h-64 w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedRiskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Line
                      type="monotone"
                      dataKey="Health"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Risk"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: SENSOR SIGNALS */}
          {activeTab === "telemetry" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Telemetry Sensors History (Temperature & Vibration)
              </h3>

              <div className="h-64 w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTelemetry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10 }} label={{ value: "Temp (°C)", angle: -90, position: "insideLeft", fill: "#38bdf8", fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#eab308" tick={{ fontSize: 10 }} label={{ value: "Vib (mm/s)", angle: 90, position: "insideRight", fill: "#eab308", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Line yAxisId="left" type="monotone" dataKey="Temp" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="Vibration" stroke="#eab308" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 4: SAFETY CORRELATION (ALERTS & INCIDENTS) */}
          {activeTab === "safety" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Correlated Phase 9 Alerts
                </h4>
                {relatedAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No active or recent alerts linked to this asset.</p>
                ) : (
                  <div className="space-y-2">
                    {relatedAlerts.map((a) => (
                      <div key={a.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className={`w-4 h-4 ${a.severity === "CRITICAL" ? "text-rose-400" : "text-amber-400"}`} />
                          <div>
                            <span className="text-xs font-semibold text-slate-200 block">{a.message || a.ruleCode}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{a.ruleCode} • {a.status}</span>
                          </div>
                        </div>
                        <Link
                          to="/alerts"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                          title="View in Alert Center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Correlated Phase 9 Incidents
                </h4>
                {relatedIncidents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No active incidents associated with this equipment.</p>
                ) : (
                  <div className="space-y-2">
                    {relatedIncidents.map((i) => (
                      <div key={i.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-cyan-400 font-bold">{i.incidentNumber}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${getSeverityBadge(i.severity)}`}>
                              {i.severity}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-200 block mt-0.5">{i.title}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">{i.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MAINTENANCE HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recorded Work Orders & Overhauls
              </h3>
              {maintenanceHistory.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No previous maintenance work orders recorded.</p>
              ) : (
                <div className="space-y-2">
                  {maintenanceHistory.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-slate-200">{m.title}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                      {m.notes && <p className="text-[11px] text-cyan-400/80 mt-1 italic">{m.notes}</p>}
                      <div className="text-[10px] text-slate-400 mt-2 font-mono">
                        Scheduled: {new Date(m.scheduledAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 sticky bottom-0 z-10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onRefresh(equipment.id)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            <span>{isRefreshing ? "Recalculating..." : "Recalculate AI Prediction"}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenWorkOrderModal(equipment.id, equipment.code)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all hover:shadow-cyan-500/20"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Schedule Work Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
