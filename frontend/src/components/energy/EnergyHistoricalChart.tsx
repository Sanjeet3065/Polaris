/**
 * POLARIS — Historical Energy Trend Chart
 * Phase 7: Real Historical Telemetry Visualization
 * 
 * Fetches actual database records from Phase 2 REST API.
 * Supports selectable time windows: 1h, 6h, 24h, 7d.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import { Zap, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { telemetryService } from "../../services/telemetryService";
import { formatPower } from "../../utils/formatters";

type TimeRangeOption = "1h" | "6h" | "24h" | "7d";

interface ChartPoint {
  timeLabel: string;
  timestamp: string;
  generation: number;
  consumption: number;
  netPower: number;
  solar: number;
  diesel: number;
}

export const EnergyHistoricalChart: React.FC = () => {
  const { selectedStation } = useStation();
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("24h");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataPoints, setDataPoints] = useState<ChartPoint[]>([]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      let fromDate: Date;

      switch (timeRange) {
        case "1h":
          fromDate = new Date(now.getTime() - 1 * 3600 * 1000);
          break;
        case "6h":
          fromDate = new Date(now.getTime() - 6 * 3600 * 1000);
          break;
        case "24h":
          fromDate = new Date(now.getTime() - 24 * 3600 * 1000);
          break;
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 24 * 3600 * 1000);
      }

      const res = await telemetryService.getCombinedEnergyHistory(selectedStation, {
        limit: 100,
        from: fromDate.toISOString(),
        to: now.toISOString()
      });

      if (!res.items || res.items.length === 0) {
        // Fallback fetch latest 50 records without date filter if database was seeded in different time window
        const fallbackRes = await telemetryService.getCombinedEnergyHistory(selectedStation, {
          limit: 50
        });

        const points = (fallbackRes.items || []).map((item) => {
          const d = new Date(item.recordedAt);
          return {
            timeLabel: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
            timestamp: item.recordedAt,
            generation: Math.round(item.generationKw),
            consumption: Math.round(item.consumptionKw),
            netPower: Math.round(item.netPowerKw),
            solar: Math.round(item.solarKw),
            diesel: Math.round(item.dieselKw)
          };
        });
        setDataPoints(points);
      } else {
        const points = res.items.map((item) => {
          const d = new Date(item.recordedAt);
          return {
            timeLabel: timeRange === "7d"
              ? `${d.getUTCDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, "0")}:00`
              : `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
            timestamp: item.recordedAt,
            generation: Math.round(item.generationKw),
            consumption: Math.round(item.consumptionKw),
            netPower: Math.round(item.netPowerKw),
            solar: Math.round(item.solarKw),
            diesel: Math.round(item.dieselKw)
          };
        });
        setDataPoints(points);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load energy history from backend API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStation, timeRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Range options definition
  const rangeOptions: { label: string; value: TimeRangeOption }[] = [
    { label: "1 Hour", value: "1h" },
    { label: "6 Hours", value: "6h" },
    { label: "24 Hours", value: "24h" },
    { label: "7 Days", value: "7d" }
  ];

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            Historical Generation vs. Consumption Trends
          </h3>
          <p className="text-xs text-slate-400">
            Authoritative historical time-series queried from PostgreSQL / Prisma REST API ({selectedStation})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center rounded-lg bg-slate-950/80 border border-slate-800 p-0.5">
            {rangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  timeRange === opt.value
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh historical query"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="h-80 w-full relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-polar-900/80 backdrop-blur-sm z-10 rounded-xl">
            <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mb-2" />
            <span className="text-xs font-mono text-slate-400">Querying historical database records...</span>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-rose-500/20 bg-rose-500/5 rounded-xl">
            <AlertCircle className="h-8 w-8 text-rose-400 mb-2" />
            <div className="text-sm font-semibold text-rose-300">Historical Query Failed</div>
            <div className="text-xs text-slate-400 max-w-md mt-1">{error}</div>
            <button
              onClick={fetchHistory}
              className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-xs font-mono text-rose-300 hover:bg-rose-500/30"
            >
              Retry Database Query
            </button>
          </div>
        )}

        {!loading && !error && dataPoints.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-slate-800/80 rounded-xl bg-slate-950/40">
            <Inbox className="h-8 w-8 text-slate-600 mb-2" />
            <div className="text-sm font-semibold text-slate-400">No historical energy records available</div>
            <div className="text-xs text-slate-500 mt-1">
              No telemetry entries recorded for station {selectedStation} in this time window.
            </div>
          </div>
        )}

        {!error && dataPoints.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="histGeneration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="histConsumption" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={{ stroke: "#334155" }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={{ stroke: "#334155" }}
                tickFormatter={(val) => `${val} kW`}
              />

              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const pt = payload[0]?.payload as ChartPoint;
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl font-mono space-y-1.5">
                      <div className="text-slate-300 font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                        <span>{pt.timeLabel} UTC</span>
                        <span className="text-[10px] text-slate-500">{new Date(pt.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-emerald-400 flex justify-between gap-4">
                        <span>Total Generation:</span>
                        <span className="font-bold">{formatPower(pt.generation)}</span>
                      </div>
                      <div className="text-amber-300/90 text-[11px] pl-2 flex justify-between gap-4">
                        <span>↳ Solar PV:</span>
                        <span>{formatPower(pt.solar)}</span>
                      </div>
                      <div className="text-orange-300/90 text-[11px] pl-2 flex justify-between gap-4">
                        <span>↳ Diesel DG:</span>
                        <span>{formatPower(pt.diesel)}</span>
                      </div>
                      <div className="text-sky-400 flex justify-between gap-4 border-t border-slate-800/60 pt-1">
                        <span>Total Demand:</span>
                        <span className="font-bold">{formatPower(pt.consumption)}</span>
                      </div>
                      <div className={`flex justify-between gap-4 font-bold border-t border-slate-800 pt-1 ${
                        pt.netPower >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        <span>Net Balance:</span>
                        <span>{pt.netPower > 0 ? `+${pt.netPower} kW` : `${pt.netPower} kW`}</span>
                      </div>
                    </div>
                  );
                }}
              />

              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              />

              <Area
                type="monotone"
                dataKey="generation"
                name="Total Generation"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#histGeneration)"
              />

              <Area
                type="monotone"
                dataKey="consumption"
                name="Total Load Demand"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#histConsumption)"
              />

              <Line
                type="monotone"
                dataKey="netPower"
                name="Net Balance (Surplus/Deficit)"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
