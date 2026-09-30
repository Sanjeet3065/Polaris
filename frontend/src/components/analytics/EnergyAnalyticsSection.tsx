import React from "react";
import { EnergyAnalyticsData } from "../../types/analytics.types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { Zap, BatteryCharging, Fuel, Sun, Gauge, Activity } from "lucide-react";

interface Props {
  data: EnergyAnalyticsData;
  isLoading: boolean;
}

export const EnergyAnalyticsSection: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-72 animate-pulse" />
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  const { metrics, timeSeries, stationComparison } = data;

  const formattedChartData = timeSeries.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...pt
  }));

  return (
    <div className="space-y-6">
      {/* Top Energy KPI Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Total Gen</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.totalGenerationKwh.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Avg {metrics.avgGenerationKw} kW</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Total Load</span>
            <Activity className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.totalConsumptionKwh.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Avg {metrics.avgConsumptionKw} kW</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Net Power</span>
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div
            className={`text-xl font-bold ${
              metrics.netPowerKw >= 0 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {metrics.netPowerKw >= 0 ? "+" : ""}
            {metrics.netPowerKw} <span className="text-xs font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Net {metrics.netEnergyKwh >= 0 ? "+" : ""}
            {metrics.netEnergyKwh} kWh
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Battery SoC</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.avgBatteryPercent ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Min {metrics.minBatteryPercent ?? "N/A"}% / Max {metrics.maxBatteryPercent ?? "N/A"}%
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Fuel Reserve</span>
            <Fuel className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.avgFuelPercent ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {metrics.fuelDaysRemaining ?? "N/A"} days autonomy
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Solar Share</span>
            <Sun className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div className="text-xl font-bold text-white">
            {metrics.solarFractionPercent ?? 0}{" "}
            <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Total {metrics.solarGenerationKwh} kWh
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Generation vs Consumption */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Power Generation vs Consumption (kW)</h3>
              <p className="text-[11px] text-slate-400">Gross microgrid supply against life support load</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">kW</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChartData}>
                <defs>
                  <linearGradient id="genGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="consGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" kW" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="generationKw" name="Generation (kW)" stroke="#f59e0b" fill="url(#genGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="consumptionKw" name="Consumption (kW)" stroke="#0ea5e9" fill="url(#consGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Net Power Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Net Power Balance (kW)</h3>
              <p className="text-[11px] text-slate-400">Generation delta over load (&gt;0 charging, &lt;0 discharge)</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">kW</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" kW" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                <Bar dataKey="netKw" name="Net Balance (kW)" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Battery SoC Trend */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Battery State of Charge (%)</h3>
              <p className="text-[11px] text-slate-400">Main station DC bus storage percentage</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <ReferenceLine y={40} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Reserve Limit (40%)", fill: "#f43f5e", fontSize: 10 }} />
                <Line type="monotone" dataKey="batteryPercent" name="Battery SoC (%)" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Fuel Reserve Trend */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Fuel Storage Reserves (%)</h3>
              <p className="text-[11px] text-slate-400">Bulk polar diesel storage tank levels</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Low Fuel Threshold (30%)", fill: "#f59e0b", fontSize: 10 }} />
                <Line type="monotone" dataKey="fuelPercent" name="Fuel Level (%)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Station Comparative Breakdown Table if All Stations */}
      {stationComparison && stationComparison.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-3">Station Comparative Energy Benchmark</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2.5 px-3">Station</th>
                  <th className="pb-2.5 px-3">Avg Generation</th>
                  <th className="pb-2.5 px-3">Avg Load</th>
                  <th className="pb-2.5 px-3">Net Balance</th>
                  <th className="pb-2.5 px-3">Battery SoC</th>
                  <th className="pb-2.5 px-3">Fuel Reserves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {stationComparison.map((st) => (
                  <tr key={st.stationCode}>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {st.stationName} ({st.stationCode})
                    </td>
                    <td className="py-2.5 px-3">{st.avgGenerationKw} kW</td>
                    <td className="py-2.5 px-3">{st.avgConsumptionKw} kW</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          st.avgGenerationKw - st.avgConsumptionKw >= 0 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {Math.round((st.avgGenerationKw - st.avgConsumptionKw) * 10) / 10} kW
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{st.avgBatteryPercent}%</td>
                    <td className="py-2.5 px-3">{st.avgFuelPercent}%</td>
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
