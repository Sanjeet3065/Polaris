import React from "react";
import { AlertFilterState } from "../../types/alert.types";
import { AlertSeverity, AlertStatus } from "../../utils/alertRules";
import { Search, RotateCcw, Filter } from "lucide-react";

interface AlertFiltersProps {
  filters: AlertFilterState;
  onChange: (filters: AlertFilterState) => void;
  onReset: () => void;
  stationLocked?: boolean;
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  filters,
  onChange,
  onReset,
  stationLocked = false
}) => {
  const severities: AlertSeverity[] = ["CRITICAL", "HIGH", "WARNING", "MEDIUM", "LOW", "INFO"];
  const statuses: AlertStatus[] = ["OPEN", "ACTIVE", "ACKNOWLEDGED", "ESCALATED", "RESOLVED", "SUPPRESSED"];
  const sourceTypes = ["ENERGY", "ENVIRONMENT", "EQUIPMENT", "INVENTORY", "LOGISTICS", "TELEMETRY"];

  return (
    <div className="p-4 rounded-xl bg-polar-900 border border-polar-750 shadow-titanium space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Filter className="w-4 h-4 text-orange-400" />
          <span className="font-mono">Alert Filters & Triage</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-polar-800 hover:bg-polar-750 rounded-lg border border-polar-700 transition-colors shadow-sm"
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
            placeholder="Search alerts by title, code, equipment..."
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-polar-950 border border-polar-750 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Station Filter (if not locked by StationContext) */}
        {!stationLocked && (
          <div>
            <select
              value={filters.stationId || "ALL"}
              onChange={(e) => onChange({ ...filters, stationId: e.target.value === "ALL" ? undefined : e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-polar-950 border border-polar-750 rounded-lg text-slate-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Stations</option>
              <option value="MAITRI">Maitri Station</option>
              <option value="BHARATI">Bharati Station</option>
            </select>
          </div>
        )}

        {/* Severity */}
        <div>
          <select
            value={filters.severity || "ALL"}
            onChange={(e) =>
              onChange({
                ...filters,
                severity: e.target.value === "ALL" ? undefined : (e.target.value as AlertSeverity)
              })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-polar-950 border border-polar-750 rounded-lg text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Severities</option>
            {severities.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={filters.status || "ALL"}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value === "ALL" ? undefined : (e.target.value as AlertStatus)
              })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-polar-950 border border-polar-750 rounded-lg text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Source Type */}
        <div className={stationLocked ? "" : "sm:col-span-2 md:col-span-1"}>
          <select
            value={filters.sourceType || "ALL"}
            onChange={(e) =>
              onChange({
                ...filters,
                sourceType: e.target.value === "ALL" ? undefined : e.target.value
              })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-polar-950 border border-polar-750 rounded-lg text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Sources</option>
            {sourceTypes.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
