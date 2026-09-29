import React, { useState } from "react";
import { Alert } from "../../types/alert.types";
import { EscalateAlertData } from "../../services/alertService";
import {
  IncidentSeverity,
  IncidentCategory,
  IncidentImpact
} from "../../utils/alertRules";
import { X, ArrowUpRight } from "lucide-react";

interface EscalateAlertModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (alertId: string, data: EscalateAlertData) => Promise<void>;
}

export const EscalateAlertModal: React.FC<EscalateAlertModalProps> = ({
  alert,
  isOpen,
  onClose,
  onSubmit
}) => {
  const mapSeverity = (sev: string): IncidentSeverity => {
    if (sev === "CRITICAL") return "CRITICAL";
    if (sev === "HIGH" || sev === "WARNING") return "HIGH";
    if (sev === "MEDIUM") return "MEDIUM";
    return "LOW";
  };

  const inferCategory = (alertItem: Alert): IncidentCategory => {
    const src = (alertItem.sourceType || alertItem.source || "").toUpperCase();
    if (src.includes("ENERGY") || src.includes("BATTERY") || src.includes("POWER")) return "ENERGY";
    if (src.includes("ENV") || src.includes("WEATHER") || src.includes("WIND")) return "ENVIRONMENT";
    if (src.includes("EQUIP") || src.includes("GEN") || src.includes("HVAC")) return "EQUIPMENT";
    if (src.includes("COMM") || src.includes("VSAT")) return "COMMUNICATION";
    if (src.includes("INVENTORY") || src.includes("STOCK")) return "INVENTORY";
    if (src.includes("LOGISTICS") || src.includes("SHIPMENT")) return "LOGISTICS";
    return "OPERATIONS";
  };

  const [title, setTitle] = useState(alert ? `Incident: ${alert.title}` : "");
  const [description, setDescription] = useState(
    alert
      ? `Escalated from active alert [${alert.title}]. Observed value: ${alert.triggerValue ?? "N/A"} ${alert.unit || ""}. Station: ${alert.station?.code || alert.stationId}.`
      : ""
  );
  const [severity, setSeverity] = useState<IncidentSeverity>(alert ? mapSeverity(alert.severity) : "HIGH");
  const [category, setCategory] = useState<IncidentCategory>(alert ? inferCategory(alert) : "OPERATIONS");
  const [impact, setImpact] = useState<IncidentImpact>("HIGH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Incident title is required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(alert.id, {
        title: title.trim(),
        description: description.trim(),
        severity,
        category,
        impact
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to escalate alert into incident";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-slate-100">Escalate Alert to Incident Room</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Alert Summary Banner */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Source Alert</div>
          <div className="font-semibold text-slate-200">{alert.title}</div>
          <div className="text-slate-400 text-[11px]">{alert.message || alert.description}</div>
          <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-cyan-400">
            <span>Station: {alert.station?.code || alert.stationId}</span>
            <span>Severity: {alert.severity}</span>
            <span>Occurrences: x{alert.occurrenceCount}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Incident Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500/50"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500/50"
              >
                <option value="POWER">POWER</option>
                <option value="ENERGY">ENERGY</option>
                <option value="ENVIRONMENT">ENVIRONMENT</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
                <option value="COMMUNICATION">COMMUNICATION</option>
                <option value="INVENTORY">INVENTORY</option>
                <option value="LOGISTICS">LOGISTICS</option>
                <option value="SAFETY">SAFETY</option>
                <option value="OPERATIONS">OPERATIONS</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Operational Impact</label>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value as IncidentImpact)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500/50"
            >
              <option value="NONE">NONE</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Incident Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Initial Operational Assessment</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Escalating..." : "Confirm Escalation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
