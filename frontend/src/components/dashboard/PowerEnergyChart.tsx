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
    <Card className="p-4 sm:p-5 bg-polar-900/75 border-polar-750 shadow-titanium space-y-4">
      {/* Header and instantaneous metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-polar-750 pb-3 sm:pb-4">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>Power Generation vs. Load</span>
          </h3>
          <p className="text-[11px] text-slate-400">Microgrid telemetry (Bifacial Solar PV + Arctic Diesel generators)</p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-polar-950/80 border border-polar-750 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400 text-[10px]">GEN:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{formatPower(energy.totalGenerationKw)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-polar-950/80 border border-polar-750 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400 text-[10px]">LOAD:</span>
            <span className="font-bold text-orange-400 tabular-nums">{formatPower(energy.totalConsumptionKw)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-polar-950/80 border border-polar-750 px-2.5 py-1 rounded-lg">
            <Fuel className="h-3 w-3 text-amber-400" />
            <span className="text-slate-400 text-[10px]">FUEL:</span>
            <span className="font-bold text-amber-300 tabular-nums">{formatLiters(energy.fuelReservesLiters)}</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyPower} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGeneration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
              unit="kW"
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
              stroke="#f97316"
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
