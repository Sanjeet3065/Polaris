import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from "recharts";
import { ThermometerSnowflake, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";

export const TemperatureTrendChart: React.FC = () => {
  const { temperatureTrend } = useStation();

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Header with trend indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ThermometerSnowflake className="h-4 w-4 text-sky-400" />
            24-Hour Temperature Trajectory
          </h3>
          <p className="text-xs text-slate-400">Continuous ground-station temperature readings</p>
        </div>

        {/* Dynamic Trend Indicator */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-sky-300 font-bold">
            {temperatureTrend.direction === "cooling" ? (
              <TrendingDown className="h-4 w-4 text-sky-400" />
            ) : temperatureTrend.direction === "warming" ? (
              <TrendingUp className="h-4 w-4 text-amber-400" />
            ) : (
              <Minus className="h-4 w-4 text-slate-400" />
            )}
            <span>{temperatureTrend.trendDelta}</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 text-[11px]">{temperatureTrend.trendLabel}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={temperatureTrend.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              unit="°C"
              domain={["dataMin - 2", "dataMax + 2"]}
            />

            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#080e1e",
                borderColor: "#1e293b",
                borderRadius: "0.5rem",
                fontSize: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
              }}
              labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
              formatter={(value: number) => [`${value.toFixed(1)} °C`, "Ambient Temperature"]}
            />

            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#0284c7", stroke: "#38bdf8", strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: "#7dd3fc", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
