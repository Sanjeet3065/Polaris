import React, { useState } from "react";
import { X, ArrowRightLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { InventoryItem } from "../../types/logistics.types";
import { logisticsService } from "../../services/logisticsService";

interface StockTransferModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [quantity, setQuantity] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const currentStationCode = item.station?.code || (item.stationId === "maitri" ? "MAITRI" : "BHARATI");
  const defaultTarget = currentStationCode === "MAITRI" ? "BHARATI" : "MAITRI";

  const numQty = parseFloat(quantity) || 0;
  const availableStock = item.quantity - (item.reservedQuantity || 0);

  const isInvalid = numQty <= 0 || numQty > availableStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) {
      setError(`Cannot transfer ${numQty} ${item.unit}. Available: ${availableStock} ${item.unit}.`);
      return;
    }
    if (!reason.trim()) {
      setError("Please provide an operational justification for this inter-station transfer.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await logisticsService.transferStock({
        sourceStationId: currentStationCode,
        targetStationId: defaultTarget,
        itemId: item.id,
        quantity: numQty,
        reference: reference.trim() || undefined,
        reason: reason.trim()
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to execute inter-station transfer.");
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
              <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
              <span>Inter-Station Supply Transfer</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Transfer supplies between Maitri and Bharati research stations
            </p>
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

          {/* Transfer Route Visualizer */}
          <div className="p-3 bg-polar-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Origin Station</span>
              <span className="text-sm font-bold text-slate-100 font-mono">
                {currentStationCode === "MAITRI" ? "Maitri (Schirmacher)" : "Bharati (Larsemann)"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                Avail: {availableStock} {item.unit}
              </span>
            </div>

            <div className="p-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ArrowRightLeft className="h-4 w-4" />
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400">Destination Station</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {defaultTarget === "MAITRI" ? "Maitri (Schirmacher)" : "Bharati (Larsemann)"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">Overland/Airlift</span>
            </div>
          </div>

          {/* Item Overview */}
          <div className="p-3 rounded-lg bg-polar-900 border border-slate-800 text-xs flex justify-between items-center">
            <div>
              <span className="font-semibold text-slate-200 block">{item.name}</span>
              <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>
            </div>
            <span className="text-xs font-mono text-slate-300">{item.category}</span>
          </div>

          {/* Quantity Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Transfer Quantity ({item.unit}) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max={availableStock}
                required
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-polar-900 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Transfer Waybill / Convoy Ref
              </label>
              <input
                type="text"
                placeholder="e.g. TRF-CONVOY-04"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-polar-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Mission Justification *
            </label>
            <textarea
              rows={2}
              required
              placeholder="State purpose (e.g. Critical reserve rebalance for winter-over readiness)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/60 resize-none"
            />
          </div>

          {/* Actions */}
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
              disabled={submitting || isInvalid}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{submitting ? "Transferring..." : "Execute Transfer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
