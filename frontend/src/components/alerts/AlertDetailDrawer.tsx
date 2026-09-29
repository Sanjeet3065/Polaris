import React, { useEffect, useState } from "react";
import { Alert } from "../../types/alert.types";
import {
  SEVERITY_CONFIG,
  ALERT_STATUS_CONFIG,
  AlertSeverity
} from "../../utils/alertRules";
import {
  X,
  Cpu,
  Layers,
  CheckCircle,
  ArrowUpRight,
  Flame,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Ban,
  Activity,
  History
} from "lucide-react";
import { alertService } from "../../services/alertService";

interface AlertDetailDrawerProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (alert: Alert) => void;
  onEscalate?: (alert: Alert) => void;
  onResolve?: (alert: Alert) => void;
  onSuppress?: (alert: Alert) => void;
  onNavigateToIncident?: (incidentId: string) => void;
  canMutate?: boolean;
}

export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  alert,
  isOpen,
  onClose,
  onAcknowledge,
  onEscalate,
  onResolve,
  onSuppress,
  onNavigateToIncident,
  canMutate = false
}) => {
  const [timeline, setTimeline] = useState<Array<{ id: string; type: string; title: string; description: string; occurredAt: string }>>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    if (alert && isOpen) {
      setIsLoadingTimeline(true);
      alertService
        .getAlertTimeline(alert.id)
        .then((items) => setTimeline(items))
        .catch((err) => console.error("Failed to load alert timeline", err))
        .finally(() => setIsLoadingTimeline(false));
    }
  }, [alert?.id, isOpen]);

  if (!isOpen || !alert) return null;

  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
  const statusCfg = ALERT_STATUS_CONFIG[alert.status] || ALERT_STATUS_CONFIG.OPEN;
  const isResolved = alert.status === "RESOLVED" || alert.status === "SUPPRESSED";
  const isAcknowledged = alert.status === "ACKNOWLEDGED";
  const isEscalated = alert.status === "ESCALATED";

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return <Flame className="w-4 h-4 text-rose-400" />;
      case "HIGH":
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case "MEDIUM":
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case "LOW":
        return <AlertCircle className="w-4 h-4 text-cyan-400" />;
      case "INFO":
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider ${sev.badge}`}>
                {getSeverityIcon(alert.severity)}
                {sev.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-medium text-slate-300 border border-slate-700">
                {alert.station?.code || alert.stationId}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-100 mt-3 leading-snug">{alert.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{alert.message || alert.description}</p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 flex-1 text-xs">
          {/* Diagnostic Metrics Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Deterministic Trigger Condition</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">{alert.ruleCode || "OPERATIONAL_RULE"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Trigger Value</div>
                <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                  {alert.triggerValue !== null && alert.triggerValue !== undefined ? alert.triggerValue : "N/A"}{" "}
                  <span className="text-[10px] font-normal text-slate-400">{alert.unit || ""}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Threshold Limit</div>
                <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                  {alert.thresholdValue !== null && alert.thresholdValue !== undefined ? alert.thresholdValue : "N/A"}{" "}
                  <span className="text-[10px] font-normal text-slate-400">{alert.unit || ""}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Detections</div>
                <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                  {alert.occurrenceCount || 1} <span className="text-[10px] font-normal text-slate-500">cycles</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
              <div>
                <span className="text-slate-500">First Detected: </span>
                <span className="font-mono text-slate-300">
                  {new Date(alert.firstDetectedAt || alert.occurredAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Last Detected: </span>
                <span className="font-mono text-slate-300">
                  {new Date(alert.lastDetectedAt || alert.occurredAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Source & Equipment Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Asset & Subsystem Telemetry</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Subsystem / Source</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {alert.sourceType || alert.source || "Station Infrastructure"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase">Equipment Name</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {alert.equipment?.name || "General Facility"}
                </div>
              </div>

              {alert.equipment?.code && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Equipment Code</div>
                  <div className="font-mono text-slate-300 mt-0.5">{alert.equipment.code}</div>
                </div>
              )}

              {alert.equipment?.category && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Category</div>
                  <div className="text-slate-300 mt-0.5">{alert.equipment.category}</div>
                </div>
              )}
            </div>
          </div>

          {/* Linked Operational Incident */}
          {alert.incidentAlerts && alert.incidentAlerts.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Linked Operational Incident</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-900/50 text-purple-300">
                  {alert.incidentAlerts[0].incident.incidentNumber}
                </span>
              </div>

              <div className="text-sm font-medium text-slate-200">
                {alert.incidentAlerts[0].incident.title}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Status: <strong className="text-purple-300">{alert.incidentAlerts[0].incident.status}</strong>
                </span>

                {onNavigateToIncident && (
                  <button
                    onClick={() => {
                      if (alert.incidentAlerts?.[0]?.incident?.id) {
                        onNavigateToIncident(alert.incidentAlerts[0].incident.id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 font-semibold underline"
                  >
                    <span>View Incident Room</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Operational Timeline */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Operational Audit Timeline</span>
            </div>

            {isLoadingTimeline ? (
              <div className="space-y-2 py-2">
                <div className="h-4 bg-slate-800/50 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-800/50 rounded animate-pulse w-1/2" />
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-slate-500 py-2 italic text-[11px]">
                Detected at {new Date(alert.firstDetectedAt || alert.occurredAt).toLocaleString()}
              </div>
            ) : (
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 pl-6">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 border-2 border-slate-900" />
                    <div className="font-semibold text-slate-200">{item.title}</div>
                    <div className="text-[11px] text-slate-400">{item.description}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(item.occurredAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Footer */}
        {canMutate && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 sticky bottom-0">
            <div className="flex items-center gap-2">
              {/* Suppress */}
              {!isResolved && onSuppress && (
                <button
                  onClick={() => onSuppress(alert)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Suppress</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Acknowledge */}
              {!isAcknowledged && !isResolved && !isEscalated && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(alert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              )}

              {/* Escalate */}
              {!isEscalated && !isResolved && onEscalate && (
                <button
                  onClick={() => onEscalate(alert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Escalate to Incident</span>
                </button>
              )}

              {/* Resolve */}
              {!isResolved && onResolve && (
                <button
                  onClick={() => onResolve(alert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Resolve Alert</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
