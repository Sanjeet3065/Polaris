import React from "react";
import { Package, CheckCircle2, AlertTriangle, AlertOctagon, XCircle } from "lucide-react";
import { Card } from "../ui/Card";
import { InventoryOverview } from "../../types/logistics.types";

interface InventoryOverviewCardsProps {
  overview: InventoryOverview | null;
  loading?: boolean;
}

export const InventoryOverviewCards: React.FC<InventoryOverviewCardsProps> = ({
  overview,
  loading = false
}) => {
  const total = overview?.totalItems || 0;
  const inStock = overview?.inStock || 0;
  const lowStock = overview?.lowStock || 0;
  const critical = overview?.criticalStock || 0;
  const outOfStock = overview?.outOfStock || 0;

  const inStockPct = total > 0 ? Math.round((inStock / total) * 100) : 0;
  const lowStockPct = total > 0 ? Math.round((lowStock / total) * 100) : 0;
  const criticalPct = total > 0 ? Math.round((critical / total) * 100) : 0;
  const outOfStockPct = total > 0 ? Math.round((outOfStock / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Catalog Items */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="h-4 w-4 text-cyan-400" />
            Total Catalog
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            {overview?.totalCategories || 0} Categories
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {loading ? "..." : total}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Active monitored SKU items
          </div>
        </div>
      </Card>

      {/* 2. Optimal Stock */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Optimal Stock
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            {inStockPct}%
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {loading ? "..." : inStock}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Reserves exceeding reorder point
          </div>
        </div>
      </Card>

      {/* 3. Low Stock / Reorder */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Low Stock
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
            {lowStockPct}%
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-amber-400">
            {loading ? "..." : lowStock}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            At or below minimum reorder point
          </div>
        </div>
      </Card>

      {/* 4. Critical Floor */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-rose-500/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="h-4 w-4 text-rose-400" />
            Critical Reserve
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400">
            {criticalPct}%
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-rose-400 flex items-center gap-2">
            {loading ? "..." : critical}
            {critical > 0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Below emergency winter floor
          </div>
        </div>
      </Card>

      {/* 5. Depleted (0) */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-red-500/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-400" />
            Out of Stock
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400">
            {outOfStockPct}%
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-red-400">
            {loading ? "..." : outOfStock}
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
            Completely depleted inventory
          </div>
        </div>
      </Card>
    </div>
  );
};
