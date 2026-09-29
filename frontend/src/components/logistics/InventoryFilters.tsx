import React from "react";
import { Search, Filter, RotateCcw, ArrowUpDown } from "lucide-react";
import { INVENTORY_CATEGORIES } from "../../utils/inventoryThresholds";
import { StationFilter } from "../../types";

interface InventoryFiltersProps {
  station: StationFilter;
  onStationChange: (station: StationFilter) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  onReset: () => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  station,
  onStationChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onReset
}) => {
  const isFiltered = Boolean(category || status || search || sortBy !== "name" || sortOrder !== "asc");

  return (
    <div className="bg-polar-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Left: Station Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-polar-950/80 rounded-lg border border-slate-800/80 w-fit">
        {(["ALL", "MAITRI", "BHARATI"] as StationFilter[]).map((st) => {
          const isActive = station === st;
          return (
            <button
              key={st}
              onClick={() => onStationChange(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {st === "ALL" ? "All Stations" : st === "MAITRI" ? "Maitri Station" : "Bharati Station"}
            </button>
          );
        })}
      </div>

      {/* Middle & Right: Search & Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search SKU, item, bay..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-polar-950/70 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-polar-950/70 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
          >
            <option value="">All Categories</option>
            {INVENTORY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-polar-950/70 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="IN_STOCK">Optimal Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="CRITICAL">Critical Reserve</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="appearance-none pl-3 pr-6 py-1.5 text-xs bg-polar-950/70 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
          >
            <option value="name">Sort: Name</option>
            <option value="quantity">Sort: Quantity</option>
            <option value="sku">Sort: SKU</option>
            <option value="category">Sort: Category</option>
            <option value="status">Sort: Status</option>
            <option value="lastUpdatedAt">Sort: Updated</option>
          </select>

          <button
            onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
            title={`Toggle order (${sortOrder === "asc" ? "Ascending" : "Descending"})`}
            className="p-1.5 bg-polar-950/70 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Reset Button */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-cyan-400 bg-slate-800/40 hover:bg-slate-800/80 rounded-lg border border-slate-700/60 transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
