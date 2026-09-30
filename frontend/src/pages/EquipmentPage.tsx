import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings2,
  Search,
  LayoutGrid,
  List,
  Box,
  Wrench,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Gauge,
  Clock
} from "lucide-react";
import { useStation } from "../context/StationContext";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { KpiCard } from "../components/ui/KpiCard";
import { cn } from "../lib/utils";


export const EquipmentPage: React.FC = () => {
  const { equipmentList, alertsList, selectedStation, stationInfo, energy } = useStation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Enhanced Equipment list with telemetry & alerts linked
  const enhancedEquipment = useMemo(() => {
    return equipmentList.map((eq) => {
      // Find matching alert
      const matchingAlert = alertsList.find(
        (a) =>
          a.description.toLowerCase().includes(eq.name.toLowerCase()) ||
          a.title.toLowerCase().includes(eq.name.toLowerCase()) ||
          (eq.category === "POWER" && a.source === "ENERGY")
      );

      let temperature: number | undefined;
      let loadPercent: number | undefined;

      if (eq.category === "POWER") {
        temperature = parseFloat((75.0 + (100 - eq.healthScore) * 0.45).toFixed(1));
        loadPercent = Math.min(98, Math.round((energy.totalConsumptionKw / (energy.totalGenerationKw || 1)) * 75));
      } else if (eq.category === "HVAC") {
        temperature = 22.5;
        loadPercent = 65;
      }

      // Map status strictly to standardized vocabulary: OPERATIONAL, WARNING, DEGRADED, CRITICAL, OFFLINE
      let normalizedStatus: "OPERATIONAL" | "WARNING" | "DEGRADED" | "CRITICAL" | "OFFLINE" = "OPERATIONAL";
      if (eq.status === "CRITICAL" || (eq.healthScore < 60 && eq.healthScore > 0)) {
        normalizedStatus = "CRITICAL";
      } else if (eq.status === "WARNING" || (eq.healthScore >= 60 && eq.healthScore < 85)) {
        normalizedStatus = "WARNING";
      } else if (eq.status === "OFFLINE" || eq.healthScore === 0) {
        normalizedStatus = "OFFLINE";
      } else if (eq.healthScore >= 85 && eq.healthScore < 90) {
        normalizedStatus = "DEGRADED";
      } else {
        normalizedStatus = "OPERATIONAL";
      }

      return {
        ...eq,
        normalizedStatus,
        temperature,
        loadPercent,
        activeAlert: matchingAlert
      };
    });
  }, [equipmentList, alertsList, energy]);

  // Filtered Equipment list
  const filteredEquipment = useMemo(() => {
    return enhancedEquipment.filter((item) => {
      const matchesSearch =
        search === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.modelNumber?.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "ALL" || item.normalizedStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [enhancedEquipment, search, selectedCategory, selectedStatus]);

  // Fleet Statistics
  const stats = useMemo(() => {
    const total = enhancedEquipment.length;
    const operational = enhancedEquipment.filter((e) => e.normalizedStatus === "OPERATIONAL").length;
    const warning = enhancedEquipment.filter((e) => e.normalizedStatus === "WARNING" || e.normalizedStatus === "DEGRADED").length;
    const critical = enhancedEquipment.filter((e) => e.normalizedStatus === "CRITICAL" || e.normalizedStatus === "OFFLINE").length;
    const avgHealth = total > 0 ? Math.round(enhancedEquipment.reduce((acc, e) => acc + e.healthScore, 0) / total) : 0;

    return { total, operational, warning, critical, avgHealth };
  }, [enhancedEquipment]);

  const categories: { label: string; value: string }[] = [
    { label: "All Categories", value: "ALL" },
    { label: "Power & Generation", value: "POWER" },
    { label: "HVAC & Climate", value: "HVAC" },
    { label: "Communication / VSAT", value: "COMMUNICATION" },
    { label: "Water & Desalination", value: "WATER_SYSTEM" },
    { label: "Life Support", value: "LIFE_SUPPORT" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Machinery & Equipment Fleet</span>
                <span className="rounded bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-xs font-mono text-orange-400 font-semibold uppercase">
                  {selectedStation}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Active life-support systems, power generators, desalination plants, and VSAT terminals at {stationInfo.name}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex rounded-lg border border-polar-750 bg-polar-900 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                viewMode === "grid"
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono"
                  : "text-slate-400 hover:text-white"
              )}
              aria-label="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                viewMode === "table"
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono"
                  : "text-slate-400 hover:text-white"
              )}
              aria-label="Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Fleet Summary KPI Cards */}
      <section aria-label="Fleet Overview KPIs" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          label="Total Equipment"
          value={stats.total}
          unit="Assets"
          icon={Settings2}
          statusVariant="info"
          subtext="Station Fleet Registry"
        />
        <KpiCard
          label="Operational"
          value={stats.operational}
          unit="Active"
          icon={CheckCircle2}
          statusVariant="nominal"
          subtext="Nominal Functioning"
        />
        <KpiCard
          label="Warning / Degraded"
          value={stats.warning}
          unit="Watch"
          icon={AlertTriangle}
          statusVariant="warning"
          subtext="Advisory Monitoring"
        />
        <KpiCard
          label="Critical / Offline"
          value={stats.critical}
          unit="Urgent"
          icon={Flame}
          statusVariant="critical"
          subtext="Requires Dispatch"
        />
        <KpiCard
          label="Average Fleet Health"
          value={`${stats.avgHealth}%`}
          icon={Gauge}
          statusVariant={stats.avgHealth >= 85 ? "nominal" : stats.avgHealth >= 70 ? "warning" : "critical"}
          subtext="Fleet Reliability Index"
        />
      </section>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-polar-750 bg-polar-900/75 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment by name, model, category..."
            className="w-full rounded-lg border border-polar-750 bg-polar-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-polar-750 bg-polar-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
            aria-label="Filter by Category"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-polar-750 bg-polar-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPERATIONAL">OPERATIONAL</option>
            <option value="WARNING">WARNING</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>

          {(search || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 px-2 py-1 font-mono"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Equipment Content View (Grid or Table) */}
      {filteredEquipment.length === 0 ? (
        <EmptyState
          title="No machinery matches criteria"
          description="Try broadening your search query or reset active category and status filters."
          actionText="Reset Filters"
          onAction={() => {
            setSearch("");
            setSelectedCategory("ALL");
            setSelectedStatus("ALL");
          }}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => (
            <Card
              key={item.id}
              className="border-polar-750 bg-polar-900/90 p-5 hover:border-orange-500/40 transition-all duration-200 flex flex-col justify-between shadow-titanium"
            >
              <div>
                {/* Card Top: Category & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {item.category.replace("_", " ")}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight mt-0.5">
                      {item.name}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Model: {item.modelNumber || "N/A"}
                    </span>
                  </div>
                  <StatusBadge status={item.normalizedStatus} size="sm" />
                </div>

                {/* Health Score Bar */}
                <div className="my-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] font-medium">Health Index:</span>
                    <span
                      className={cn(
                        "font-mono font-bold text-xs",
                        item.healthScore >= 85
                          ? "text-emerald-400"
                          : item.healthScore >= 70
                          ? "text-amber-400"
                          : "text-rose-400"
                      )}
                    >
                      {item.healthScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        item.healthScore >= 85
                          ? "bg-emerald-500"
                          : item.healthScore >= 70
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      )}
                      style={{ width: `${item.healthScore}%` }}
                    />
                  </div>
                </div>

                {/* Operating Telemetry Snapshot */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-lg bg-polar-950/60 border border-slate-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TEMP:</span>
                    <span className="text-slate-200 font-semibold">
                      {item.temperature !== undefined ? `${item.temperature}°C` : "Nominal"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">LOAD:</span>
                    <span className="text-slate-200 font-semibold">
                      {item.loadPercent !== undefined ? `${item.loadPercent}%` : "Stable"}
                    </span>
                  </div>
                </div>

                {/* Active Alert Banner if Linked */}
                {item.activeAlert && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-bold text-[11px] block truncate">
                        {item.activeAlert.title}
                      </span>
                      <span className="text-[10px] text-amber-300/80 line-clamp-1">
                        {item.activeAlert.description}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Metadata & Quick Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{item.lastChecked}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/digital-twin")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-semibold transition-colors"
                    title="Inspect in 3D Digital Twin"
                  >
                    <Box className="h-3 w-3" />
                    <span>3D Twin</span>
                  </button>
                  <button
                    onClick={() => navigate("/maintenance")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[10px] font-semibold transition-colors"
                    title="View Predictive Maintenance & RUL"
                  >
                    <Wrench className="h-3 w-3 text-amber-400" />
                    <span>RUL</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-polar-750 bg-polar-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="border-b border-polar-750 bg-polar-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3">Equipment Name</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Health Score</th>
                  <th className="px-4 py-3">Operating Temp</th>
                  <th className="px-4 py-3">Active Alert</th>
                  <th className="px-4 py-3">Last Checked</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      <div className="font-bold text-slate-100">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {item.modelNumber || item.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                        {item.stationId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-[11px]">
                      {item.category.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.normalizedStatus} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "font-bold",
                          item.healthScore >= 85
                            ? "text-emerald-400"
                            : item.healthScore >= 70
                            ? "text-amber-400"
                            : "text-rose-400"
                        )}
                      >
                        {item.healthScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.temperature !== undefined ? `${item.temperature}°C` : "Nominal"}
                    </td>
                    <td className="px-4 py-3">
                      {item.activeAlert ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{item.activeAlert.severity}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {item.lastChecked}
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate("/digital-twin")}
                          className="px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-semibold border border-orange-500/30"
                        >
                          3D
                        </button>
                        <button
                          onClick={() => navigate("/maintenance")}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700"
                        >
                          RUL
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
