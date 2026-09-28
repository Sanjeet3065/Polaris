import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import { Zap, Fuel } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { formatPower, formatLiters } from "../../utils/formatters";

export const PowerEnergyChart: React.FC = () => {
  const { energy, hourlyPower } = useStation();

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-4">
      {/* Header and instantaneous metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            Power Generation vs. Load Demand
          </h3>
          <p className="text-xs text-slate-400">Continuous 24-hour microgrid telemetry (Solar PV + Arctic Diesel)</p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400">Total Gen:</span>
            <span className="font-bold text-emerald-400">{formatPower(energy.totalGenerationKw)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400">Total Load:</span>
            <span className="font-bold text-sky-400">{formatPower(energy.totalConsumptionKw)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Fuel className="h-3 w-3 text-amber-400" />
            <span className="text-slate-400">Fuel:</span>
            <span className="font-bold text-amber-300">{formatLiters(energy.fuelReservesLiters)}</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyPower} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGeneration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
              unit="kW"
            />

            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#080e1e",
                borderColor: "#1e293b",
                borderRadius: "0.5rem",
                fontSize: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
              }}
              labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: "4px" }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
            />

            <Area
              type="monotone"
              dataKey="generation"
              name="Generation (kW)"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGeneration)"
            />
            <Area
              type="monotone"
              dataKey="consumption"
              name="Consumption (kW)"
              stroke="#38bdf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConsumption)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
