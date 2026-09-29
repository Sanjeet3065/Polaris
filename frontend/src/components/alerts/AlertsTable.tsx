import React from "react";
import { Alert } from "../../types/alert.types";
import {
  SEVERITY_CONFIG,
  ALERT_STATUS_CONFIG,
  AlertSeverity
} from "../../utils/alertRules";
import {
  AlertTriangle,
  Flame,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

interface AlertsTableProps {
  alerts: Alert[];
  isLoading: boolean;
  onSelectAlert: (alert: Alert) => void;
  onAcknowledge?: (alert: Alert) => void;
  onEscalate?: (alert: Alert) => void;
  onResolve?: (alert: Alert) => void;
  pagination: { page: number; limit: number; total: number };
  onPageChange: (page: number) => void;
  canMutate?: boolean;
}

export const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  isLoading,
  onSelectAlert,
  onAcknowledge,
  onEscalate,
  onResolve,
  pagination,
  onPageChange,
  canMutate = false
}) => {
  const getSeverityIcon = (sev: AlertSeverity) => {
    switch (sev) {
      case "CRITICAL":
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case "HIGH":
      case "WARNING":
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
      case "MEDIUM":
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      case "LOW":
        return <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />;
      case "INFO":
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Operational Alerts Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          All Antarctic life-support, energy, environmental, and equipment telemetry systems are currently within nominal operational limits.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4">Alert & Anomaly</th>
              <th className="py-3 px-3">Station</th>
              <th className="py-3 px-3">Equipment / Source</th>
              <th className="py-3 px-3">Occurrences</th>
              <th className="py-3 px-3">Last Detected</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {alerts.map((alert) => {
              const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
              const statusCfg = ALERT_STATUS_CONFIG[alert.status] || ALERT_STATUS_CONFIG.OPEN;
              const isResolved = alert.status === "RESOLVED" || alert.status === "SUPPRESSED";
              const isAcknowledged = alert.status === "ACKNOWLEDGED";
              const isEscalated = alert.status === "ESCALATED";

              return (
                <tr
                  key={alert.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  onClick={() => onSelectAlert(alert)}
                >
                  {/* Severity */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${sev.badge}`}
                    >
                      {getSeverityIcon(alert.severity)}
                      {sev.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusCfg.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Alert details */}
                  <td className="py-3 px-4 min-w-[220px]">
                    <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {alert.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                      {alert.message || alert.description}
                    </div>
                    {alert.triggerValue !== null && alert.triggerValue !== undefined && (
                      <div className="text-[10px] font-mono text-cyan-400/90 mt-0.5">
                        Triggered at: {alert.triggerValue} {alert.unit || ""}{" "}
                        {alert.thresholdValue !== null && alert.thresholdValue !== undefined && (
                          <span className="text-slate-500">(Limit: {alert.thresholdValue} {alert.unit || ""})</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Station */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-medium text-slate-300 border border-slate-700">
                      {alert.station?.code || alert.stationId}
                    </span>
                  </td>

                  {/* Equipment / Source */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-300">
                      {alert.equipment?.name || alert.source || alert.sourceType || "Station Facility"}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {alert.equipment?.code || alert.ruleCode || "SYSTEM"}
                    </div>
                  </td>

                  {/* Occurrences */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300">
                      x{alert.occurrenceCount || 1}
                    </span>
                  </td>

                  {/* Last Detected */}
                  <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(alert.lastDetectedAt || alert.occurredAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(alert.lastDetectedAt || alert.occurredAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric"
                      })}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details */}
                      <button
                        onClick={() => onSelectAlert(alert)}
                        title="View Full Details"
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Acknowledge (if not yet acknowledged/resolved) */}
                      {!isAcknowledged && !isResolved && !isEscalated && onAcknowledge && canMutate && (
                        <button
                          onClick={() => onAcknowledge(alert)}
                          title="Acknowledge Alert"
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition-colors"
                        >
                          Ack
                        </button>
                      )}

                      {/* Escalate to Incident */}
                      {!isEscalated && !isResolved && onEscalate && canMutate && (
                        <button
                          onClick={() => onEscalate(alert)}
                          title="Escalate into Operational Incident"
                          className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium transition-colors"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Escalate</span>
                        </button>
                      )}

                      {/* Resolve */}
                      {!isResolved && onResolve && canMutate && (
                        <button
                          onClick={() => onResolve(alert)}
                          title="Mark Resolved"
                          className="p-1 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-200">
            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-200">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-semibold text-slate-200">{pagination.total}</span> alerts
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-300">
            Page {pagination.page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
