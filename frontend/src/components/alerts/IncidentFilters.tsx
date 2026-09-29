import React from "react";
import { IncidentFilterState } from "../../types/alert.types";
import {
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory
} from "../../utils/alertRules";
import { Search, RotateCcw, Filter } from "lucide-react";

interface IncidentFiltersProps {
  filters: IncidentFilterState;
  onChange: (filters: IncidentFilterState) => void;
  onReset: () => void;
  stationLocked?: boolean;
}

export const IncidentFilters: React.FC<IncidentFiltersProps> = ({
  filters,
  onChange,
  onReset,
  stationLocked = false
}) => {
  const statuses: IncidentStatus[] = ["OPEN", "INVESTIGATING", "MITIGATING", "RESOLVED", "CLOSED"];
  const severities: IncidentSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const categories: IncidentCategory[] = [
    "POWER",
    "ENERGY",
    "ENVIRONMENT",
    "EQUIPMENT",
    "COMMUNICATION",
    "INVENTORY",
    "LOGISTICS",
    "SAFETY",
    "OPERATIONS",
    "OTHER"
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Filter className="w-4 h-4 text-purple-400" />
          <span>Incident Command Filters</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-md border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search incidents by #, title, description..."
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
          />
        </div>

        {/* Station Filter (if not locked by StationContext) */}
        {!stationLocked && (
          <div>
            <select
              value={filters.stationId || "ALL"}
              onChange={(e) =>
                onChange({
                  ...filters,
                  stationId: e.target.value === "ALL" ? undefined : e.target.value
                })
              }
              className="w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500/50"
            >
              <option value="ALL">All Stations</option>
              <option value="MAITRI">Maitri Station</option>
              <option value="BHARATI">Bharati Station</option>
            </select>
          </div>
        )}

        {/* Status */}
        <div>
          <select
            value={filters.status || "ALL"}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value === "ALL" ? undefined : (e.target.value as IncidentStatus)
              })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <select
            value={filters.severity || "ALL"}
            onChange={(e) =>
              onChange({
                ...filters,
                severity: e.target.value === "ALL" ? undefined : (e.target.value as IncidentSeverity)
              })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="ALL">All Severities</option>
            {severities.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className={stationLocked ? "" : "sm:col-span-2 md:col-span-1"}>
          <select
            value={filters.category || "ALL"}
            onChange={(e) =>
              onChange({
                ...filters,
                category: e.target.value === "ALL" ? undefined : (e.target.value as IncidentCategory)
              })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
