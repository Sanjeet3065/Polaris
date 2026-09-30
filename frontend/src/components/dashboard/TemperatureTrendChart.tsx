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
    <Card className="p-4 sm:p-5 bg-polar-900/75 border-polar-750 shadow-titanium space-y-4">
      {/* Header with trend indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-polar-750 pb-3 sm:pb-4">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ThermometerSnowflake className="h-4 w-4 text-orange-400" />
            <span>24-Hour Temperature Trajectory</span>
          </h3>
          <p className="text-[11px] text-slate-400">Continuous meteorological telemetry & freeze-risk forecasting</p>
        </div>

        {/* Dynamic Trend Indicator */}
        <div className="flex items-center gap-2 rounded-lg border border-polar-750 bg-polar-950/80 px-2.5 sm:px-3 py-1 text-xs font-mono self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-orange-400 font-bold">
            {temperatureTrend.direction === "cooling" ? (
              <TrendingDown className="h-4 w-4 text-orange-400" />
            ) : temperatureTrend.direction === "warming" ? (
              <TrendingUp className="h-4 w-4 text-amber-400" />
            ) : (
              <Minus className="h-4 w-4 text-slate-400" />
            )}
            <span className="tabular-nums">{temperatureTrend.trendDelta}</span>
          </div>
          <span className="text-polar-700">|</span>
          <span className="text-slate-300 text-[11px]">{temperatureTrend.trendLabel}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={temperatureTrend.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292E3B" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#758097"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#292E3B" }}
            />
            <YAxis
              stroke="#758097"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#292E3B" }}
              unit="°C"
              domain={["dataMin - 2", "dataMax + 2"]}
            />

            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#13151B",
                borderColor: "#292E3B",
                borderRadius: "0.75rem",
                fontSize: "11px",
                fontFamily: "JetBrains Mono, monospace",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.7)"
              }}
              labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
              formatter={(value: number) => [`${value.toFixed(1)} °C`, "Ambient Temperature"]}
            />

            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#13151B", stroke: "#f97316", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#f97316", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
