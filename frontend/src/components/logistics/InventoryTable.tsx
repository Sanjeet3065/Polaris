import {
  Boxes,
  Eye,
  ArrowRightLeft,
  ArrowUpDown,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { InventoryItem } from "../../types/logistics.types";
import { INVENTORY_STATUS_THEMES, OperationalInventoryStatus } from "../../utils/inventoryThresholds";

interface InventoryTableProps {
  items: InventoryItem[];
  loading?: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onSelectItem: (item: InventoryItem) => void;
  onRecordMovement: (item: InventoryItem) => void;
  onTransferStock: (item: InventoryItem) => void;
  canManage: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  loading = false,
  page,
  totalPages,
  totalItems,
  limit: _limit,
  onPageChange,
  onSelectItem,
  onRecordMovement,
  onTransferStock,
  canManage
}) => {
  return (
    <div className="bg-polar-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="bg-polar-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800/90 select-none">
            <tr>
              <th className="py-3 px-4">Item & SKU</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Station</th>
              <th className="py-3 px-4 text-right">Available Stock</th>
              <th className="py-3 px-4 text-right">Safety Thresholds</th>
              <th className="py-3 px-4 text-center">Operational Status</th>
              <th className="py-3 px-4">Storage Bay</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-4 bg-slate-800/50 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Boxes className="h-8 w-8 text-slate-600" />
                    <p className="font-semibold text-slate-300">No Inventory Items Found</p>
                    <p className="text-[11px] text-slate-500">
                      Try adjusting station, category, or search filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const evalToken = item.evaluation
                  ? INVENTORY_STATUS_THEMES[item.evaluation.status]
                  : INVENTORY_STATUS_THEMES[item.status as OperationalInventoryStatus] || INVENTORY_STATUS_THEMES.UNKNOWN;

                const availableQty = item.quantity - (item.reservedQuantity || 0);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectItem(item)}
                  >
                    {/* Item Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 group-hover:text-orange-400 transition-colors line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-500">SKU:</span> {item.sku}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
                        {item.category}
                      </span>
                    </td>

                    {/* Station */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                          item.station?.code === "MAITRI"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                        }`}
                      >
                        {item.station?.name || item.stationId}
                      </span>
                    </td>

                    {/* Available Stock */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-sm font-bold ${
                            availableQty <= 0
                              ? "text-red-400"
                              : availableQty <= item.minimumQuantity
                              ? "text-amber-400"
                              : "text-slate-100"
                          }`}
                        >
                          {item.quantity.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </span>
                        {item.reservedQuantity > 0 && (
                          <span className="text-[10px] text-blue-400">
                            {item.reservedQuantity} {item.unit} reserved
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Safety Thresholds */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500">Min:</span> {item.minimumQuantity} {item.unit}
                      </div>
                      {item.criticalQuantity != null && (
                        <div className="text-[10px] text-rose-400/80">
                          <span className="text-slate-500">Crit:</span> {item.criticalQuantity} {item.unit}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold border ${evalToken.badgeClass}`}
                      >
                        {evalToken.status === "CRITICAL" && <ShieldAlert className="h-3 w-3 animate-pulse" />}
                        {evalToken.status === "LOW_STOCK" && <AlertTriangle className="h-3 w-3" />}
                        {evalToken.label}
                      </span>
                    </td>

                    {/* Storage Bay */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <span className="flex items-center gap-1 line-clamp-1 max-w-[160px]">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{item.storageLocation || "Central Store"}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => onSelectItem(item)}
                          title="View Specifications & History"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Record Movement */}
                        {canManage && (
                          <button
                            onClick={() => onRecordMovement(item)}
                            title="Consume or Receive Stock"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Inter-Station Transfer */}
                        {canManage && (
                          <button
                            onClick={() => onTransferStock(item)}
                            title="Transfer Stock to Other Station"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-polar-950/70 border-t border-slate-800/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing <span className="font-mono text-slate-200">{items.length}</span> of{" "}
          <span className="font-mono text-slate-200">{totalItems}</span> catalog items
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>

          <span className="font-mono px-2">
            Page {page} of {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
