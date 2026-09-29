import React, { useState } from "react";
import { CreateIncidentData } from "../../services/alertService";
import {
  IncidentSeverity,
  IncidentCategory,
  IncidentImpact
} from "../../utils/alertRules";
import { X, AlertOctagon } from "lucide-react";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIncidentData) => Promise<void>;
  defaultStation?: string;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultStation = "MAITRI"
}) => {
  const [stationId, setStationId] = useState(defaultStation === "ALL" ? "MAITRI" : defaultStation);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("HIGH");
  const [category, setCategory] = useState<IncidentCategory>("OPERATIONS");
  const [impact, setImpact] = useState<IncidentImpact>("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        stationId,
        title: title.trim(),
        description: description.trim(),
        severity,
        category,
        impact
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create operational incident";
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
            <AlertOctagon className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-slate-100">Log Operational Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Antarctic Station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500/50"
              >
                <option value="MAITRI">Maitri (Schirmacher Oasis)</option>
                <option value="BHARATI">Bharati (Larsemann Hills)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Severity</label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Incident Title</label>
            <input
              type="text"
              placeholder="e.g., Main Generator 01 Overheat — Maitri Power Block"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Detailed Description & Context</label>
            <textarea
              rows={3}
              placeholder="Describe anomalous observations, initial readings, or suspected failure modes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
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
              {isSubmitting ? "Creating..." : "Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
