import React, { useState } from "react";
import { EquipmentAnalyticsData } from "../../types/analytics.types";
import { Settings2, ShieldCheck, AlertTriangle, AlertCircle, Search, Filter } from "lucide-react";

interface Props {
  data: EquipmentAnalyticsData;
  isLoading: boolean;
}

export const EquipmentAnalyticsSection: React.FC<Props> = ({ data, isLoading }) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-96 animate-pulse" />
      </div>
    );
  }

  const { summary, healthDistribution, riskDistribution, equipment } = data;

  const categories = Array.from(new Set(equipment.map((e) => e.category)));

  const filteredEquipment = equipment.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getHealthBadge = (health: number) => {
    if (health >= 85) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (health >= 65) {
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    }
    return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  };

  const getRiskBadge = (band: string | null) => {
    if (!band) return "bg-slate-800 text-slate-400 border-slate-700";
    switch (band) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "MODERATE":
      case "GUARDED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Fleet Summary Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Monitored</div>
            <div className="text-xl font-bold text-white">
              {summary.totalMonitored} <span className="text-xs font-normal text-slate-400">assets</span>
            </div>
            <div className="text-[10px] text-slate-500">Fleet average health: {summary.avgHealthScore}%</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Optimal Assets</div>
            <div className="text-xl font-bold text-emerald-400">
              {summary.healthyCount} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <div className="text-[10px] text-slate-500">Health index ≥ 80%</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Degraded Assets</div>
            <div className="text-xl font-bold text-amber-300">
              {summary.degradedCount} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <div className="text-[10px] text-slate-500">Health index 50% - 79%</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Critical Priority</div>
            <div className="text-xl font-bold text-rose-400">
              {summary.criticalCount} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <div className="text-[10px] text-slate-500">Health index &lt; 50%</div>
          </div>
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Health Score Distribution</h3>
          <p className="text-[11px] text-slate-400 mb-4">Proportion of equipment across diagnostic ratings</p>
          <div className="space-y-3">
            {healthDistribution.map((hd) => (
              <div key={hd.band}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">{hd.band}</span>
                  <span className="text-slate-400">
                    {hd.count} assets ({hd.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      hd.band.includes("Optimal")
                        ? "bg-emerald-500"
                        : hd.band.includes("Good")
                        ? "bg-sky-500"
                        : hd.band.includes("Degraded")
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${hd.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Predictive Risk Distribution</h3>
          <p className="text-[11px] text-slate-400 mb-4">Advisory risk band categorization from Phase 10</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {riskDistribution.map((rd) => (
              <div key={rd.band} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">{rd.band}</div>
                <div className="text-2xl font-bold text-white mt-1">{rd.count}</div>
                <div className="text-[10px] text-slate-500">assets flagged</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Machinery Fleet Diagnostic Registry Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Machinery Diagnostic Registry</h3>
            <p className="text-[11px] text-slate-400">Station equipment fleet ordered by real-time health rating</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search equipment..."
                className="bg-slate-950 border border-slate-750 text-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs w-48 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-750 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Equipment</th>
                <th className="pb-3 px-3">Station</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Health Score</th>
                <th className="pb-3 px-3">Risk Band</th>
                <th className="pb-3 px-3">Est. RUL</th>
                <th className="pb-3 px-3">Alerts</th>
                <th className="pb-3 px-3">Incidents</th>
                <th className="pb-3 px-3">Maintenances</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No equipment matches the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{eq.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{eq.code}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-300">{eq.stationCode}</td>
                    <td className="py-3 px-3 text-slate-400">{eq.category}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getHealthBadge(eq.healthPercent)}`}>
                        {eq.healthPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getRiskBadge(eq.riskBand)}`}>
                        {eq.riskBand || "LOW"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {eq.estimatedRulDays ? `${eq.estimatedRulDays} days` : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${eq.alertCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
                        {eq.alertCount}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${eq.incidentCount > 0 ? "text-amber-400" : "text-slate-400"}`}>
                        {eq.incidentCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{eq.maintenanceCount}</td>
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
