import React, { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Clock,
  History,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  FileText
} from "lucide-react";
import { InventoryItem, InventoryMovement } from "../../types/logistics.types";
import { INVENTORY_STATUS_THEMES, evaluateInventoryStatus } from "../../utils/inventoryThresholds";
import { logisticsService } from "../../services/logisticsService";

interface InventoryItemDrawerProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordMovement: (item: InventoryItem) => void;
  onTransferStock: (item: InventoryItem) => void;
  canManage: boolean;
}

export const InventoryItemDrawer: React.FC<InventoryItemDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onRecordMovement,
  onTransferStock,
  canManage
}) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setLoadingMovements(true);
      logisticsService
        .getMovements({ itemId: item.id, limit: 15 })
        .then((res) => {
          if (res?.data) {
            setMovements(res.data);
          }
        })
        .catch(() => setMovements([]))
        .finally(() => setLoadingMovements(false));
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const evaluation = item.evaluation || evaluateInventoryStatus({
    quantity: item.quantity,
    minimumQuantity: item.minimumQuantity,
    criticalQuantity: item.criticalQuantity,
    reservedQuantity: item.reservedQuantity,
    unit: item.unit
  });

  const statusTheme = INVENTORY_STATUS_THEMES[evaluation.status];

  // Stock level bar percentage
  const maxRef = Math.max(item.quantity, item.minimumQuantity * 1.5, 1);
  const currentPct = Math.min(100, Math.round((item.quantity / maxRef) * 100));
  const minPct = Math.min(100, Math.round((item.minimumQuantity / maxRef) * 100));
  const critPct = item.criticalQuantity ? Math.min(100, Math.round((item.criticalQuantity / maxRef) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-polar-950 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-slideInRight">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-polar-900/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  item.station?.code === "MAITRI"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                }`}
              >
                {item.station?.name || item.stationId}
              </span>
              <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">{item.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{item.category}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status Evaluation Banner */}
          <div className={`p-4 rounded-xl border ${statusTheme.borderClass} ${statusTheme.bgClass} flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Operational Condition
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${statusTheme.badgeClass}`}>
                {statusTheme.label}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{evaluation.description}</p>
          </div>

          {/* Stock Metrics Card */}
          <div className="bg-polar-900/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Reserve Balances & Capacity
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-polar-950/80 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">Current Stock</span>
                <span className="text-xl font-bold font-mono text-slate-100">
                  {item.quantity}
                </span>
                <span className="text-[10px] text-slate-400 block">{item.unit}</span>
              </div>

              <div className="p-3 bg-polar-950/80 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">Reorder Point</span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  {item.minimumQuantity}
                </span>
                <span className="text-[10px] text-slate-400 block">{item.unit}</span>
              </div>

              <div className="p-3 bg-polar-950/80 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">Critical Reserve</span>
                <span className="text-xl font-bold font-mono text-rose-400">
                  {item.criticalQuantity || (item.minimumQuantity * 0.5).toFixed(0)}
                </span>
                <span className="text-[10px] text-slate-400 block">{item.unit}</span>
              </div>
            </div>

            {/* Visual Level Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Stock Ratio</span>
                <span>
                  {item.quantity} / {maxRef.toFixed(0)} {item.unit}
                </span>
              </div>
              <div className="relative h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.quantity <= (item.criticalQuantity || item.minimumQuantity * 0.5)
                      ? "bg-rose-500"
                      : item.quantity <= item.minimumQuantity
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${currentPct}%` }}
                />
                {/* Min indicator mark */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400/90 z-10"
                  style={{ left: `${minPct}%` }}
                  title={`Reorder Level (${item.minimumQuantity})`}
                />
                {/* Critical mark */}
                {critPct > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-400/90 z-10"
                    style={{ left: `${critPct}%` }}
                    title={`Critical Level (${item.criticalQuantity})`}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>Crit: {critPct}%</span>
                <span>Min: {minPct}%</span>
                <span>Max Ref</span>
              </div>
            </div>
          </div>

          {/* Item Specifications */}
          <div className="bg-polar-900/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Storage & Catalog Specs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Storage Bay</span>
                  <span className="font-semibold text-slate-200">
                    {item.storageLocation || "Central Logistics Warehouse"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Last Audited</span>
                  <span className="font-mono text-slate-200">
                    {new Date(item.lastUpdatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {item.description && (
              <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs">
                <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 leading-relaxed text-[11px]">{item.description}</p>
              </div>
            )}
          </div>

          {/* Chronological Movement Ledger */}
          <div className="bg-polar-900/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-4 w-4 text-indigo-400" />
                Stock Movement Ledger
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {movements.length} recent entries
              </span>
            </div>

            {loadingMovements ? (
              <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
                Loading audit ledger...
              </div>
            ) : movements.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No recorded stock movements yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70 max-h-60 overflow-y-auto">
                {movements.map((mov) => {
                  const isReceived = mov.type === "RECEIVED";
                  const isConsumed = mov.type === "CONSUMED";

                  return (
                    <div key={mov.id} className="py-2.5 flex items-start justify-between text-xs">
                      <div className="flex items-start gap-2">
                        <div
                          className={`p-1 rounded mt-0.5 ${
                            isReceived
                              ? "bg-emerald-500/10 text-emerald-400"
                              : isConsumed
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {isReceived ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : isConsumed ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowRightLeft className="h-3 w-3" />
                          )}
                        </div>

                        <div>
                          <div className="font-semibold text-slate-200">
                            {mov.type}: {mov.reason || "Operational adjustment"}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{new Date(mov.createdAt).toLocaleDateString()}</span>
                            {mov.reference && <span>Ref: {mov.reference}</span>}
                            {mov.user && <span>By: {mov.user.name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span
                          className={`font-bold ${
                            isReceived
                              ? "text-emerald-400"
                              : isConsumed
                              ? "text-rose-400"
                              : "text-blue-400"
                          }`}
                        >
                          {isReceived ? "+" : isConsumed ? "-" : ""}
                          {mov.quantity} {item.unit}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Bal: {mov.newStock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {canManage && (
          <div className="p-4 border-t border-slate-800 bg-polar-900/80 flex items-center justify-end gap-2">
            <button
              onClick={() => onTransferStock(item)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Inter-Station Transfer</span>
            </button>

            <button
              onClick={() => onRecordMovement(item)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Record Movement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
