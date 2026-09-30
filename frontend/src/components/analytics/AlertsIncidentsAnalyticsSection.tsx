import React from "react";
import { AlertAnalyticsData, IncidentAnalyticsData } from "../../types/analytics.types";

interface Props {
  alertData: AlertAnalyticsData;
  incidentData: IncidentAnalyticsData;
  isLoading: boolean;
}

export const AlertsIncidentsAnalyticsSection: React.FC<Props> = ({ alertData, incidentData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { summary: alertSummary, bySeverity: alertSeverity, topRules } = alertData;
  const { summary: incSummary, recentIncidents } = incidentData;

  return (
    <div className="space-y-6">
      {/* Alert & Incident KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Total Alarms</div>
          <div className="text-xl font-bold text-white">{alertSummary.totalAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-1">Logged operational events</div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Active Alarms</div>
          <div className="text-xl font-bold text-rose-400">{alertSummary.openAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-1">Requiring acknowledgment</div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Resolved Alarms</div>
          <div className="text-xl font-bold text-emerald-400">{alertSummary.resolvedAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-1">Cleared by operator/system</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Mean Ack Time (MTTA)</div>
          <div className="text-xl font-bold text-sky-400">
            {alertSummary.mttaMinutes !== null ? `${alertSummary.mttaMinutes} min` : "N/A"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Operator reaction speed</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Mean Resolve Time (MTTR)</div>
          <div className="text-xl font-bold text-amber-400">
            {alertSummary.mttrMinutes !== null ? `${alertSummary.mttrMinutes} min` : "N/A"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Anomaly remediation latency</div>
        </div>

        <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Incident Tickets</div>
          <div className="text-xl font-bold text-purple-400">
            {incSummary.totalIncidents} <span className="text-xs font-normal text-slate-400">({incSummary.openIncidents} open)</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Higher-level command tickets</div>
        </div>
      </div>

      {/* Grid: Top Recurring Alarm Rules & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Recurring Rules */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Top Recurring Alarm Rules</h3>
          <p className="text-[11px] text-slate-400 mb-4">Most frequent operational triggers across the station fleet</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2.5 px-2">Rule Code</th>
                  <th className="pb-2.5 px-2">Alarm Title</th>
                  <th className="pb-2.5 px-2">Severity</th>
                  <th className="pb-2.5 px-2">Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {topRules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No alarm records found for this period.
                    </td>
                  </tr>
                ) : (
                  topRules.map((r) => (
                    <tr key={r.ruleCode}>
                      <td className="py-2.5 px-2 font-mono text-slate-400">{r.ruleCode}</td>
                      <td className="py-2.5 px-2 font-medium text-white">{r.title}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            r.severity === "CRITICAL"
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : r.severity === "HIGH"
                              ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-white">{r.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Alarm Severity Profile</h3>
          <p className="text-[11px] text-slate-400 mb-4">Proportion of alerts across defined operational urgency levels</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-rose-400">Critical Alarms</div>
              <div className="text-2xl font-bold text-white mt-1">{alertSeverity.CRITICAL || 0}</div>
              <div className="text-[10px] text-slate-400">Life-support & power failures</div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/25 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-orange-400">High Severity</div>
              <div className="text-2xl font-bold text-white mt-1">{alertSeverity.HIGH || 0}</div>
              <div className="text-[10px] text-slate-400">Subsystem degradation</div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-amber-400">Medium Severity</div>
              <div className="text-2xl font-bold text-white mt-1">{alertSeverity.MEDIUM || 0}</div>
              <div className="text-[10px] text-slate-400">Parameter boundary excursions</div>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/25 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-sky-400">Low / Informational</div>
              <div className="text-2xl font-bold text-white mt-1">
                {(alertSeverity.LOW || 0) + (alertSeverity.INFO || 0)}
              </div>
              <div className="text-[10px] text-slate-400">Standard operational logs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Command Tickets Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-1">Operational Incident Command Logs</h3>
        <p className="text-[11px] text-slate-400 mb-4">
          High-level operational incident tickets with linked telemetry alarms
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Ticket #</th>
                <th className="pb-3 px-3">Title</th>
                <th className="pb-3 px-3">Station</th>
                <th className="pb-3 px-3">Severity</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Started At</th>
                <th className="pb-3 px-3">Linked Alarms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {recentIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No incident command tickets recorded in this time window.
                  </td>
                </tr>
              ) : (
                recentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">{inc.incidentNumber}</td>
                    <td className="py-3 px-3 font-semibold text-white">{inc.title}</td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{inc.stationCode}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          inc.severity === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : inc.severity === "HIGH"
                            ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{inc.category}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(inc.startedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                        {inc.alertCount} alarms
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
