import React, { useState } from "react";
import { X, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import { InventoryItem, StockMovementType } from "../../types/logistics.types";
import { logisticsService } from "../../services/logisticsService";
import { evaluateInventoryStatus } from "../../utils/inventoryThresholds";

interface StockMovementModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [type, setType] = useState<StockMovementType>("CONSUMED");
  const [quantity, setQuantity] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const numQty = parseFloat(quantity) || 0;
  const currentStock = item.quantity;
  const availableStock = currentStock - (item.reservedQuantity || 0);

  let newStock = currentStock;
  if (type === "CONSUMED") {
    newStock = currentStock - numQty;
  } else if (type === "RECEIVED") {
    newStock = currentStock + numQty;
  } else if (type === "ADJUSTED") {
    newStock = numQty;
  }

  const isInvalidConsumption = (type === "CONSUMED" && numQty > availableStock) || newStock < 0;

  const previewEval = evaluateInventoryStatus({
    quantity: Math.max(0, newStock),
    minimumQuantity: item.minimumQuantity,
    criticalQuantity: item.criticalQuantity,
    reservedQuantity: item.reservedQuantity,
    unit: item.unit
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError("Please specify a valid quantity greater than zero.");
      return;
    }
    if (type === "CONSUMED" && numQty > availableStock) {
      setError(`Cannot consume ${numQty} ${item.unit}. Only ${availableStock} ${item.unit} available.`);
      return;
    }
    if (!reason.trim()) {
      setError("Operational reason or work order authorization is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await logisticsService.recordMovement(item.id, {
        type,
        quantity: numQty,
        source: source.trim() || undefined,
        destination: destination.trim() || undefined,
        reference: reference.trim() || undefined,
        reason: reason.trim()
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record stock movement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-polar-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-polar-900/60">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Record Stock Movement</span>
              <span className="text-xs font-mono text-cyan-400">({item.sku})</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.name}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Movement Type Buttons */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Movement Classification
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("CONSUMED")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  type === "CONSUMED"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Consume</span>
              </button>

              <button
                type="button"
                onClick={() => setType("RECEIVED")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  type === "RECEIVED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>Receive</span>
              </button>

              <button
                type="button"
                onClick={() => setType("ADJUSTED")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  type === "ADJUSTED"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Audit Adjust</span>
              </button>
            </div>
          </div>

          {/* Quantity Input with Live Balance Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {type === "ADJUSTED" ? "New Audited Count" : "Quantity Delta"} ({item.unit}) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-polar-900 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Projected Stock Balance */}
            <div className="p-2.5 rounded-lg bg-polar-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Projected Balance
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-lg font-bold font-mono ${
                    isInvalidConsumption ? "text-rose-400" : "text-cyan-400"
                  }`}
                >
                  {newStock.toLocaleString()} {item.unit}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${previewEval.badgeClass}`}
                >
                  {previewEval.label}
                </span>
              </div>
            </div>
          </div>

          {/* Reference & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Reference / Work Order #
              </label>
              <input
                type="text"
                placeholder="e.g. WO-PWR-2026-104"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {type === "CONSUMED" ? "Consuming Facility" : "Source Hub"}
              </label>
              <input
                type="text"
                placeholder={type === "CONSUMED" ? "e.g. Generator Room Day Tank" : "e.g. Cape Town Airlift"}
                value={type === "CONSUMED" ? destination : source}
                onChange={(e) =>
                  type === "CONSUMED" ? setDestination(e.target.value) : setSource(e.target.value)
                }
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Operational Justification *
            </label>
            <textarea
              rows={2}
              required
              placeholder="State mission purpose (e.g. Scheduled bi-weekly maintenance refueling)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/60 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || isInvalidConsumption || numQty <= 0}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{submitting ? "Committing Ledger..." : "Confirm Movement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
