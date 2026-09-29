import React, { useState } from "react";
import { Alert } from "../../types/alert.types";
import { X, ShieldCheck, CheckCircle, Ban } from "lucide-react";

interface ActionModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface AcknowledgeModalProps extends ActionModalProps {
  onConfirm: (alertId: string, note?: string) => Promise<void>;
}

export const AcknowledgeModal: React.FC<AcknowledgeModalProps> = ({
  alert,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(alert.id, note.trim() || undefined);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Acknowledge Alert</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Acknowledge receipt and take operational responsibility for:
        </p>

        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          <span className="font-semibold text-slate-200">{alert.title}</span>
          <div className="text-slate-400 text-[11px] mt-0.5">{alert.message || alert.description}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Triage Note (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g., Station technician dispatched to check battery rack connectors..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Acknowledging..." : "Confirm Acknowledge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface ResolveModalProps extends ActionModalProps {
  onConfirm: (alertId: string, note?: string) => Promise<void>;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  alert,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(alert.id, note.trim() || undefined);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Resolve Operational Alert</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          <span className="font-semibold text-slate-200">{alert.title}</span>
          <div className="text-slate-400 text-[11px] mt-0.5">{alert.message || alert.description}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Resolution Summary (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g., Wind speed dropped below 50 km/h; shelter battening released."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Resolving..." : "Confirm Resolve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface SuppressModalProps extends ActionModalProps {
  onConfirm: (alertId: string, reason: string) => Promise<void>;
}

export const SuppressModal: React.FC<SuppressModalProps> = ({
  alert,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A documented suppression reason is required by NCPOR audit rules.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(alert.id, reason.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-100">Suppress Alert</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          <span className="font-semibold text-slate-200">{alert.title}</span>
          <div className="text-slate-400 text-[11px] mt-0.5">{alert.message || alert.description}</div>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Suppression Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Scheduled maintenance on Generator 01; thermal alarm expected."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Suppressing..." : "Confirm Suppression"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
