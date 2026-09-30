import React from "react";
import { EnvironmentAnalyticsData } from "../../types/analytics.types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { Thermometer, Wind, Compass, AlertTriangle } from "lucide-react";

interface Props {
  data: EnvironmentAnalyticsData;
  isLoading: boolean;
}

export const EnvironmentAnalyticsSection: React.FC<Props> = ({ data, isLoading }) => {
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

  const { metrics, thresholdExceedances, timeSeries } = data;

  const formattedChartData = timeSeries.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...pt
  }));

  return (
    <div className="space-y-6">
      {/* Weather Threshold Exceedance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Blizzard Events</div>
            <div className="text-xl font-bold text-rose-400">
              {thresholdExceedances.blizzardConditionEvents}{" "}
              <span className="text-xs font-normal text-slate-400">events</span>
            </div>
            <div className="text-[10px] text-slate-500">Wind &gt; 70 km/h + Vis &lt; 1 km</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Extreme Cold Excursions</div>
            <div className="text-xl font-bold text-sky-300">
              {thresholdExceedances.extremeColdEvents}{" "}
              <span className="text-xs font-normal text-slate-400">events</span>
            </div>
            <div className="text-[10px] text-slate-500">Temp &lt; -40.0°C threshold</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Gale / High Wind</div>
            <div className="text-xl font-bold text-amber-300">
              {thresholdExceedances.highWindEvents}{" "}
              <span className="text-xs font-normal text-slate-400">events</span>
            </div>
            <div className="text-[10px] text-slate-500">Sustained wind &gt; 60 km/h</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Severe Weather Duration</div>
            <div className="text-xl font-bold text-purple-300">
              {thresholdExceedances.hoursOutsideThresholds}{" "}
              <span className="text-xs font-normal text-slate-400">hours</span>
            </div>
            <div className="text-[10px] text-slate-500">Outside standard polar limits</div>
          </div>
        </div>
      </div>

      {/* Atmospheric Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Avg Temperature</div>
          <div className="text-lg font-bold text-white">
            {metrics.avgTemperature ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Min {metrics.minTemperature ?? "N/A"}°C / Max {metrics.maxTemperature ?? "N/A"}°C
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Avg Wind Speed</div>
          <div className="text-lg font-bold text-white">
            {metrics.avgWindSpeed ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Gusts up to {metrics.maxWindSpeed ?? "N/A"} km/h
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Barometer</div>
          <div className="text-lg font-bold text-white">
            {metrics.avgPressure ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Min {metrics.minPressure ?? "N/A"} hPa
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Humidity</div>
          <div className="text-lg font-bold text-white">
            {metrics.avgHumidity ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Relative air moisture</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Visibility</div>
          <div className="text-lg font-bold text-white">
            {metrics.avgVisibility ?? "N/A"}{" "}
            <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Optical distance</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Solar Irradiance</div>
          <div className="text-lg font-bold text-white">
            {metrics.avgSolarRadiation ?? 0}{" "}
            <span className="text-xs font-normal text-slate-400">W/m²</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Solar flux index</div>
        </div>
      </div>

      {/* Environmental Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Temperature Trend with -40°C Threshold */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Ambient Temperature (°C)</h3>
              <p className="text-[11px] text-slate-400">Continuous external temperature with extreme cold threshold</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">°C</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="°C" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <ReferenceLine y={-40} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Extreme Cold (-40°C)", fill: "#f43f5e", fontSize: 10 }} />
                <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Wind Velocity Trend with 60 km/h Threshold */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Wind Speed (km/h)</h3>
              <p className="text-[11px] text-slate-400">Polar anemometer readings with high wind threshold</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">km/h</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" km/h" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Gale (60 km/h)", fill: "#f59e0b", fontSize: 10 }} />
                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Blizzard (70 km/h)", fill: "#f43f5e", fontSize: 10 }} />
                <Line type="monotone" dataKey="windSpeed" name="Wind (km/h)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Barometric Pressure Trend with 970 hPa Threshold */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Barometric Pressure (hPa)</h3>
              <p className="text-[11px] text-slate-400">Atmospheric pressure drops indicate approaching low pressure storms</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">hPa</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={["dataMin - 10", "dataMax + 10"]} unit=" hPa" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <ReferenceLine y={970} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Storm Warning (<970 hPa)", fill: "#f43f5e", fontSize: 10 }} />
                <Line type="monotone" dataKey="pressure" name="Pressure (hPa)" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Visibility & Solar Irradiance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Optical Visibility Range (km)</h3>
              <p className="text-[11px] text-slate-400">Sensor visibility measurements (&lt;1 km indicates whiteout)</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">km</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" km" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
                <ReferenceLine y={1} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Whiteout Limit (1 km)", fill: "#f43f5e", fontSize: 10 }} />
                <Line type="monotone" dataKey="visibility" name="Visibility (km)" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
