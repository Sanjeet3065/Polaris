import React, { useEffect, useState } from "react";
import { Incident } from "../../types/alert.types";
import {
  SEVERITY_CONFIG,
  INCIDENT_STATUS_CONFIG,
  IncidentStatus,
  VALID_INCIDENT_TRANSITIONS
} from "../../utils/alertRules";
import {
  X,
  CheckCircle,
  UserCheck,
  Send,
  MessageSquare,
  History,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Search,
  Wrench,
  Archive
} from "lucide-react";
import { alertService } from "../../services/alertService";

interface IncidentDetailDrawerProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: IncidentStatus, resolutionSummary?: string) => Promise<void>;
  onAddNote: (content: string) => Promise<void>;
  onUnlinkAlert?: (alertId: string) => Promise<void>;
  canMutate?: boolean;
}

export const IncidentDetailDrawer: React.FC<IncidentDetailDrawerProps> = ({
  incident,
  isOpen,
  onClose,
  onStatusChange,
  onAddNote,
  onUnlinkAlert,
  canMutate = false
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "notes" | "timeline">("overview");
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [resolutionSummaryInput, setResolutionSummaryInput] = useState("");
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<IncidentStatus | null>(null);

  const [timeline, setTimeline] = useState<Array<{ id: string; type: string; title: string; description: string; occurredAt: string }>>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    if (incident && isOpen && activeTab === "timeline") {
      setIsLoadingTimeline(true);
      alertService
        .getIncidentTimeline(incident.id)
        .then((items) => setTimeline(items))
        .catch((err) => console.error("Failed to load incident timeline", err))
        .finally(() => setIsLoadingTimeline(false));
    }
  }, [incident?.id, isOpen, activeTab]);

  if (!isOpen || !incident) return null;

  const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.INFO;
  const statusCfg = INCIDENT_STATUS_CONFIG[incident.status] || INCIDENT_STATUS_CONFIG.OPEN;
  const allowedTransitions = VALID_INCIDENT_TRANSITIONS[incident.status] || [];

  const handleStatusClick = (nextStatus: IncidentStatus) => {
    if (nextStatus === "RESOLVED" || nextStatus === "CLOSED") {
      setTargetStatus(nextStatus);
      setShowResolutionModal(true);
    } else {
      setIsUpdatingStatus(true);
      onStatusChange(nextStatus)
        .catch((err) => console.error(err))
        .finally(() => setIsUpdatingStatus(false));
    }
  };

  const handleConfirmResolution = async () => {
    if (!targetStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(targetStatus, resolutionSummaryInput.trim() || undefined);
      setShowResolutionModal(false);
      setResolutionSummaryInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSubmittingNote) return;
    setIsSubmittingNote(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case "OPEN":
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case "INVESTIGATING":
        return <Search className="w-3.5 h-3.5" />;
      case "MITIGATING":
        return <Wrench className="w-3.5 h-3.5" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "CLOSED":
        return <Archive className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/50 px-2.5 py-0.5 rounded border border-purple-800/50">
                {incident.incidentNumber}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider ${sev.badge}`}>
                {incident.severity}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-medium text-slate-300 border border-slate-700">
                {incident.station?.code || incident.stationId}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-100 mt-3 leading-snug">{incident.title}</h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{incident.description}</p>

          {/* Lifecycle State Controls */}
          {canMutate && allowedTransitions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Advance Lifecycle:
              </span>
              <div className="flex items-center gap-2">
                {allowedTransitions.map((next: IncidentStatus) => {
                  const isResolve = next === "RESOLVED" || next === "CLOSED";
                  return (
                    <button
                      key={next}
                      onClick={() => handleStatusClick(next)}
                      disabled={isUpdatingStatus}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        isResolve
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25"
                      } disabled:opacity-50`}
                    >
                      {getStatusIcon(next)}
                      <span>Mark {next}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 mt-4 pt-2 border-t border-slate-800/50">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-slate-800 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "alerts"
                  ? "bg-slate-800 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Linked Alerts</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 font-mono text-purple-400">
                {incident.alerts?.length ?? 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "notes"
                  ? "bg-slate-800 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Operator Notes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 font-mono text-cyan-400">
                {incident.notes?.length ?? 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "timeline"
                  ? "bg-slate-800 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Timeline</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 flex-1 text-xs">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Core Attributes */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Incident Context
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Station</div>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {incident.station?.name || incident.stationId}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Category</div>
                    <div className="font-semibold text-slate-200 mt-0.5">{incident.category}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Operational Impact</div>
                    <div className="font-semibold text-amber-400 mt-0.5">{incident.impact}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Assigned Operator</div>
                    <div className="font-medium text-slate-300 mt-0.5 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{incident.assignedUser?.name || "Unassigned"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Created By</div>
                    <div className="text-slate-300 mt-0.5">{incident.createdBy?.name || "System"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Started At</div>
                    <div className="font-mono text-slate-300 mt-0.5">
                      {new Date(incident.startedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution / Root Cause if available */}
              {(incident.rootCause || incident.resolutionSummary) && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50 space-y-2">
                  <div className="font-semibold text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Resolution Summary & Root Cause</span>
                  </div>
                  {incident.rootCause && (
                    <div className="text-slate-300">
                      <strong className="text-slate-400">Root Cause: </strong>
                      {incident.rootCause}
                    </div>
                  )}
                  {incident.resolutionSummary && (
                    <div className="text-slate-300">
                      <strong className="text-slate-400">Mitigation: </strong>
                      {incident.resolutionSummary}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span>Associated Telemetry Alerts ({incident.alerts?.length || 0})</span>
              </div>

              {incident.alerts && incident.alerts.length > 0 ? (
                <div className="space-y-2">
                  {incident.alerts.map(({ alert }) => (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                              SEVERITY_CONFIG[alert.severity]?.badge || ""
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="font-semibold text-slate-200">{alert.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{alert.message || alert.description}</div>
                        {alert.triggerValue !== null && alert.triggerValue !== undefined && (
                          <div className="text-[10px] font-mono text-cyan-400">
                            Trigger: {alert.triggerValue} {alert.unit || ""}{" "}
                            {alert.thresholdValue !== null && alert.thresholdValue !== undefined && (
                              <span className="text-slate-500">(Limit: {alert.thresholdValue})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {canMutate && onUnlinkAlert && (
                        <button
                          onClick={() => onUnlinkAlert(alert.id)}
                          title="Unlink Alert from Incident"
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500">
                  No alerts linked directly to this incident.
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4 flex flex-col h-full">
              {/* Chronological Notes */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                {incident.notes && incident.notes.length > 0 ? (
                  incident.notes.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-200">
                            {note.author?.name || note.authorName || "Station Operator"}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-purple-400 font-mono">
                            {note.author?.role || "OPERATOR"}
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 italic">
                    No operator notes recorded yet. Add operational observations below.
                  </div>
                )}
              </div>

              {/* Add Note Input Form */}
              {canMutate && (
                <form onSubmit={handleSendNote} className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="relative">
                    <textarea
                      rows={2}
                      placeholder="Add operational investigation note, mitigation step, or test result..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNote.trim() || isSubmittingNote}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <History className="w-4 h-4 text-purple-400" />
                <span>Incident Operational Timeline</span>
              </div>

              {isLoadingTimeline ? (
                <div className="space-y-2 py-4">
                  <div className="h-4 bg-slate-800/50 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-800/50 rounded animate-pulse w-1/2" />
                </div>
              ) : timeline.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic">No timeline entries recorded yet.</div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 pl-6">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-slate-900" />
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
          )}
        </div>
      </div>

      {/* Resolution Prompt Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Mark Incident as {targetStatus}</span>
            </h3>

            <p className="text-xs text-slate-400">
              Provide a brief summary of how this operational incident was investigated and mitigated for official MoES/NCPOR audit logs:
            </p>

            <textarea
              rows={3}
              placeholder="e.g., Generator 01 coolant flush completed; thermal readings returned to nominal 74°C."
              value={resolutionSummaryInput}
              onChange={(e) => setResolutionSummaryInput(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResolutionModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                disabled={isUpdatingStatus}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Confirm {targetStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
