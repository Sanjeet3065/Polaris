import React, { useState } from "react";
import { X, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from "../../utils/inventoryThresholds";
import { logisticsService } from "../../services/logisticsService";
import { StationFilter } from "../../types";

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeStation: StationFilter;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activeStation
}) => {
  const [stationId, setStationId] = useState<string>(
    activeStation === "BHARATI" ? "BHARATI" : "MAITRI"
  );
  const [sku, setSku] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>(INVENTORY_CATEGORIES[0]);
  const [quantity, setQuantity] = useState<string>("0");
  const [unit, setUnit] = useState<string>(INVENTORY_UNITS[0]);
  const [minimumQuantity, setMinimumQuantity] = useState<string>("10");
  const [criticalQuantity, setCriticalQuantity] = useState<string>("4");
  const [storageLocation, setStorageLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numQty = parseFloat(quantity);
    const numMin = parseFloat(minimumQuantity);
    const numCrit = criticalQuantity ? parseFloat(criticalQuantity) : undefined;

    if (isNaN(numQty) || numQty < 0) {
      setError("Quantity cannot be negative.");
      return;
    }
    if (isNaN(numMin) || numMin < 0) {
      setError("Minimum reorder quantity cannot be negative.");
      return;
    }
    if (numCrit !== undefined && numCrit > numMin) {
      setError("Critical emergency reserve should not exceed minimum reorder threshold.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await logisticsService.createInventoryItem({
        stationId,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        quantity: numQty,
        unit,
        minimumQuantity: numMin,
        criticalQuantity: numCrit,
        storageLocation: storageLocation.trim() || undefined,
        description: description.trim() || undefined
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to catalog inventory item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-polar-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-polar-900/60">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-cyan-400" />
              <span>Catalog New Inventory Item</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Register mission equipment, spare parts, or consumable reserves
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

          {/* Station & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Target Station *
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="MAITRI">Maitri Station (Schirmacher Oasis)</option>
                <option value="BHARATI">Bharati Station (Larsemann Hills)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Stock Keeping Unit (SKU) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MAITRI-GEN-BELT-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 font-mono uppercase focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RO Potable Water Desalination Cartridge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Logistics Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
              >
                {INVENTORY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantities & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Initial Stock *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
              >
                {INVENTORY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Reorder Min *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Critical Floor
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={criticalQuantity}
                onChange={(e) => setCriticalQuantity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Storage Location */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Storage Location / Shelf / Bay
            </label>
            <input
              type="text"
              placeholder="e.g. Energy Centre Lower Level / Bay 4"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-polar-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Technical Specifications & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Item specifications, operating guidelines, or supplier details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              disabled={submitting || !sku.trim() || !name.trim()}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{submitting ? "Registering..." : "Add to Catalog"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
