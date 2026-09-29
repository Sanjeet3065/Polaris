/**
 * POLARIS — Historical Environmental Trend Chart
 * Phase 7: Real Historical Microclimate Visualization
 * 
 * Fetches actual database records from Phase 2 REST API.
 * Supports selectable time windows (1h, 6h, 24h, 7d) and metric groupings.
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
import { Thermometer, Wind, Gauge, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { telemetryService, EnvironmentalReadingItem } from "../../services/telemetryService";
import { formatTemperature, formatWind, formatPressure } from "../../utils/formatters";

type TimeRangeOption = "1h" | "6h" | "24h" | "7d";
type MetricGroupOption = "temp_wind" | "pressure" | "all";

interface EnvChartPoint {
  timeLabel: string;
  timestamp: string;
  temperature: number;
  windSpeed: number;
  pressure: number;
  humidity: number;
  visibility: number;
}

export const EnvironmentHistoricalChart: React.FC = () => {
  const { selectedStation } = useStation();
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("24h");
  const [metricGroup, setMetricGroup] = useState<MetricGroupOption>("temp_wind");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataPoints, setDataPoints] = useState<EnvChartPoint[]>([]);

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

      const res = await telemetryService.getCombinedEnvironmentHistory(selectedStation, {
        limit: 100,
        from: fromDate.toISOString(),
        to: now.toISOString()
      });

      let items = res.items || [];
      if (items.length === 0) {
        // Fallback fetch latest 50 records without date filter
        const fallbackRes = await telemetryService.getCombinedEnvironmentHistory(selectedStation, {
          limit: 50
        });
        items = fallbackRes.items || [];
      }

      const points: EnvChartPoint[] = items.map((item: EnvironmentalReadingItem) => {
        const d = new Date(item.recordedAt);
        return {
          timeLabel: timeRange === "7d"
            ? `${d.getUTCDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, "0")}:00`
            : `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
          timestamp: item.recordedAt,
          temperature: Number(item.temperature.toFixed(1)),
          windSpeed: Math.round(item.windSpeed),
          pressure: Math.round(item.pressure),
          humidity: Math.round(item.humidity),
          visibility: Number(item.visibility.toFixed(1))
        };
      });

      setDataPoints(points);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load environmental history from backend API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedStation, timeRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const rangeOptions: { label: string; value: TimeRangeOption }[] = [
    { label: "1 Hour", value: "1h" },
    { label: "6 Hours", value: "6h" },
    { label: "24 Hours", value: "24h" },
    { label: "7 Days", value: "7d" }
  ];

  const groupOptions: { label: string; value: MetricGroupOption; icon: React.FC<{ className?: string }> }[] = [
    { label: "Temp & Wind", value: "temp_wind", icon: Thermometer },
    { label: "Pressure Trend", value: "pressure", icon: Gauge },
    { label: "All Sensors", value: "all", icon: Wind }
  ];

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-400" />
            Historical Antarctic Climate & Meteorology
          </h3>
          <p className="text-xs text-slate-400">
            Microclimate station telemetry recorded in PostgreSQL / Prisma ({selectedStation})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Group Selector */}
          <div className="flex items-center rounded-lg bg-slate-950/80 border border-slate-800 p-0.5">
            {groupOptions.map((grp) => (
              <button
                key={grp.value}
                onClick={() => setMetricGroup(grp.value)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1 ${
                  metricGroup === grp.value
                    ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <grp.icon className="h-3 w-3" />
                <span>{grp.label}</span>
              </button>
            ))}
          </div>

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
            title="Refresh environmental query"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-polar-900/80 backdrop-blur-sm z-10 rounded-xl">
            <RefreshCw className="h-6 w-6 text-sky-400 animate-spin mb-2" />
            <span className="text-xs font-mono text-slate-400">Querying AWS weather station history...</span>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-rose-500/20 bg-rose-500/5 rounded-xl">
            <AlertCircle className="h-8 w-8 text-rose-400 mb-2" />
            <div className="text-sm font-semibold text-rose-300">Environmental Query Failed</div>
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
            <div className="text-sm font-semibold text-slate-400">No environmental readings available</div>
            <div className="text-xs text-slate-500 mt-1">
              No weather station logs found for station {selectedStation} in this time window.
            </div>
          </div>
        )}

        {!error && dataPoints.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="histTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="histWind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="histPressure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={{ stroke: "#334155" }}
              />

              {metricGroup === "pressure" ? (
                <YAxis
                  domain={["dataMin - 10", "dataMax + 10"]}
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={{ stroke: "#334155" }}
                  tickFormatter={(val) => `${val} hPa`}
                />
              ) : (
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={{ stroke: "#334155" }}
                  tickFormatter={(val) => `${val} °C`}
                />
              )}

              {metricGroup === "temp_wind" && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={{ stroke: "#334155" }}
                  tickFormatter={(val) => `${val} km/h`}
                />
              )}

              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const pt = payload[0]?.payload as EnvChartPoint;
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl font-mono space-y-1.5">
                      <div className="text-slate-300 font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                        <span>{pt.timeLabel} UTC</span>
                        <span className="text-[10px] text-slate-500">{new Date(pt.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-cyan-400 flex justify-between gap-4">
                        <span>Temperature:</span>
                        <span className="font-bold">{formatTemperature(pt.temperature)}</span>
                      </div>
                      <div className="text-sky-400 flex justify-between gap-4">
                        <span>Wind Velocity:</span>
                        <span className="font-bold">{formatWind(pt.windSpeed)}</span>
                      </div>
                      <div className="text-indigo-400 flex justify-between gap-4">
                        <span>Barometer:</span>
                        <span className="font-bold">{formatPressure(pt.pressure)}</span>
                      </div>
                      <div className="text-blue-300 flex justify-between gap-4">
                        <span>Relative Humidity:</span>
                        <span>{pt.humidity}%</span>
                      </div>
                      <div className="text-emerald-400 flex justify-between gap-4">
                        <span>Optical Visibility:</span>
                        <span>{pt.visibility} km</span>
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

              {(metricGroup === "temp_wind" || metricGroup === "all") && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Ambient Temperature (°C)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#histTemp)"
                />
              )}

              {(metricGroup === "temp_wind" || metricGroup === "all") && (
                <Area
                  yAxisId={metricGroup === "temp_wind" ? "right" : "left"}
                  type="monotone"
                  dataKey="windSpeed"
                  name="Wind Velocity (km/h)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#histWind)"
                />
              )}

              {(metricGroup === "pressure" || metricGroup === "all") && (
                <Line
                  yAxisId={metricGroup === "pressure" ? undefined : "left"}
                  type="monotone"
                  dataKey="pressure"
                  name="Barometric Pressure (hPa)"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
