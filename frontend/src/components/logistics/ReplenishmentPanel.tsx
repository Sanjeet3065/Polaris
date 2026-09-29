import React from "react";
import { AlertTriangle, ArrowRight, ShieldCheck, ArrowUpDown } from "lucide-react";
import { InventoryItem } from "../../types/logistics.types";
import { INVENTORY_STATUS_THEMES, OperationalInventoryStatus } from "../../utils/inventoryThresholds";

interface ReplenishmentPanelProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onRecordMovement: (item: InventoryItem) => void;
  canManage: boolean;
}

export const ReplenishmentPanel: React.FC<ReplenishmentPanelProps> = ({
  items,
  onSelectItem,
  onRecordMovement,
  canManage
}) => {
  // Filter for items requiring replenishment
  const actionItems = items.filter(
    (item) => item.status === "LOW_STOCK" || item.status === "CRITICAL" || item.status === "OUT_OF_STOCK" || item.quantity <= item.minimumQuantity
  );

  if (actionItems.length === 0) {
    return (
      <div className="bg-polar-900/60 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Replenishment Status: Resilient
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All monitored station supplies and mission reserves are currently above safety reorder thresholds.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
          Nominal Stock Levels
        </span>
      </div>
    );
  }

  return (
    <div className="bg-polar-900/70 border border-amber-500/30 rounded-xl p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Priority Replenishment Advisory
            </h4>
            <p className="text-[11px] text-slate-400">
              <span className="font-bold text-amber-400 font-mono">{actionItems.length}</span> items require replenishment or convoy transfer to maintain winter safety margins.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
          Action Required
        </span>
      </div>

      {/* Item cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {actionItems.slice(0, 6).map((item) => {
          const evalToken = item.evaluation
            ? INVENTORY_STATUS_THEMES[item.evaluation.status]
            : INVENTORY_STATUS_THEMES[item.status as OperationalInventoryStatus] || INVENTORY_STATUS_THEMES.LOW_STOCK;

          // Target replenishment: bring to 1.5x minimum reorder point
          const suggestedReplenish = Math.max(0, Math.round(item.minimumQuantity * 1.5 - item.quantity));

          return (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-polar-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-200 line-clamp-1">
                    {item.name}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${evalToken.badgeClass} shrink-0`}>
                    {evalToken.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>{item.station?.name || item.stationId}</span>
                  <span>•</span>
                  <span>SKU: {item.sku}</span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current</span>
                    <span className={`font-bold ${item.quantity <= 0 ? "text-red-400" : "text-amber-400"}`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Suggested Reorder</span>
                    <span className="font-bold text-cyan-400">
                      +{suggestedReplenish} {item.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={() => onSelectItem(item)}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>Specs</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                {canManage && (
                  <button
                    onClick={() => onRecordMovement(item)}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Intake</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
