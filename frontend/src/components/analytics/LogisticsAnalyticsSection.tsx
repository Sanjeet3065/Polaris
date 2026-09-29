import React from "react";
import { LogisticsAnalyticsData } from "../../types/analytics.types";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  data: LogisticsAnalyticsData;
  isLoading: boolean;
}

export const LogisticsAnalyticsSection: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, categoryDistribution, shipmentStatusDistribution, recentMovements } = data;

  return (
    <div className="space-y-6">
      {/* Top Logistics KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Managed SKUs</div>
          <div className="text-xl font-bold text-white">{summary.totalItems}</div>
          <div className="text-[10px] text-slate-500 mt-1">Catalog items tracked</div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Critical Stock</div>
          <div className="text-xl font-bold text-rose-400">{summary.criticalStockItems}</div>
          <div className="text-[10px] text-slate-500 mt-1">Below safety reserve</div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Low Stock Alerts</div>
          <div className="text-xl font-bold text-amber-300">{summary.lowStockItems}</div>
          <div className="text-[10px] text-slate-500 mt-1">Nearing reorder point</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Ledger Movements</div>
          <div className="text-xl font-bold text-sky-400">{summary.totalMovements}</div>
          <div className="text-[10px] text-slate-500 mt-1">Immutable stock deltas</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Consumption Events</div>
          <div className="text-xl font-bold text-slate-200">{summary.consumptionMovements}</div>
          <div className="text-[10px] text-slate-500 mt-1">Dispatched to operations</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Polar Shipments</div>
          <div className="text-xl font-bold text-emerald-400">{summary.totalShipments}</div>
          <div className="text-[10px] text-slate-500 mt-1">Resupply voyages</div>
        </div>
      </div>

      {/* Grid: Category Allocation & Shipment Statuses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Allocation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Supply Category Allocation</h3>
          <p className="text-[11px] text-slate-400 mb-4">Stock density and critical shortages by supply discipline</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2.5 px-3">Category</th>
                  <th className="pb-2.5 px-3">SKUs</th>
                  <th className="pb-2.5 px-3">Total Qty</th>
                  <th className="pb-2.5 px-3">Shortages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {categoryDistribution.map((cat) => (
                  <tr key={cat.category}>
                    <td className="py-2.5 px-3 font-semibold text-white">{cat.category}</td>
                    <td className="py-2.5 px-3">{cat.itemCount} items</td>
                    <td className="py-2.5 px-3 font-mono">{cat.totalQuantity.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      {cat.criticalCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {cat.criticalCount} critical
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Nominal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resupply Shipments Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Polar Resupply Voyage Pipeline</h3>
          <p className="text-[11px] text-slate-400 mb-4">Active and planned resupply shipping manifests</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(shipmentStatusDistribution).map(([status, count]) => (
              <div key={status} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400">{status}</div>
                <div className="text-2xl font-bold text-white mt-1">{count}</div>
                <div className="text-[10px] text-slate-500">manifests</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Movements Ledger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-1">Recent Inventory Movement Ledger</h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Audited historical transactions logged in immutable inventory ledger
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Item Name</th>
                <th className="pb-3 px-3">SKU</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Qty Delta</th>
                <th className="pb-3 px-3">Previous Stock</th>
                <th className="pb-3 px-3">New Balance</th>
                <th className="pb-3 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No inventory movement records in this period.
                  </td>
                </tr>
              ) : (
                recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{m.itemName}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{m.sku}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          m.type === "CONSUMED"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : m.type === "RECEIVED"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                        }`}
                      >
                        {m.type === "CONSUMED" ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold font-mono">
                      {m.type === "CONSUMED" ? "-" : "+"}
                      {m.quantity}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{m.previousStock}</td>
                    <td className="py-3 px-3 text-white font-mono font-semibold">{m.newStock}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(m.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
