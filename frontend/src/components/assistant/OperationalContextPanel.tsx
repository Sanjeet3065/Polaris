import React from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Wind,
  Wrench,
  TriangleAlert,
  Compass,
  ExternalLink,
  Activity,
  Layers
} from "lucide-react";
import { useStation } from "../../context/StationContext";

interface Props {
  stationCode: string;
}

export const OperationalContextPanel: React.FC<Props> = ({ stationCode }) => {
  const { stationInfo, energy, environment, kpiSummary } = useStation();

  const isMaitri = stationCode.toUpperCase().includes("MAITRI");
  const coords = isMaitri ? "70°45′58″S, 11°44′09″E" : "69°24′26″S, 76°11′14″E";
  const terrain = isMaitri ? "Schirmacher Oasis (Inland Rocky)" : "Larsemann Hills (Coastal Fjords)";

  const powerGen = energy?.totalGenerationKw ?? kpiSummary?.generationKw ?? 184;
  const powerLoad = energy?.totalConsumptionKw ?? kpiSummary?.consumptionKw ?? 142;
  const batterySoC = energy?.batteryPercentage ?? kpiSummary?.batteryPercent ?? 84;
  const windSpeed = environment?.windSpeedKmh ?? 28;
  const temperature = environment?.temperatureCelsius ?? -18.4;

  return (
    <div className="w-80 border-l border-polar-750 bg-polar-950/80 p-4 space-y-4 overflow-y-auto hidden lg:block text-xs text-slate-300">
      {/* Station Header */}
      <div className="bg-polar-900 border border-polar-750 rounded-xl p-3.5 shadow-hud">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
              {stationInfo?.name || `${stationCode} Station`}
            </h3>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="text-[10px] text-slate-400 font-mono">{coords}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{terrain}</div>
      </div>

      {/* Live Operational Telemetry */}
      <div className="bg-polar-900 border border-polar-750 rounded-xl p-3.5 space-y-2.5 shadow-hud">
        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-polar-750">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-white font-mono">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            <span>Live Telemetry</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Stream Active</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Generation:</span>
            </span>
            <span className="font-bold text-white font-mono">{powerGen} kW</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Station Load:</span>
            </span>
            <span className="font-bold text-white font-mono">{powerLoad} kW</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Battery SoC:</span>
            <span className="font-bold text-emerald-400 font-mono">{batterySoC}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              <span>Wind Velocity:</span>
            </span>
            <span className="font-bold text-white font-mono">{windSpeed} km/h</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Ambient Temp:</span>
            <span className="font-bold text-white font-mono">{temperature} °C</span>
          </div>
        </div>
      </div>

      {/* Safety & Alarms Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-md">
        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-white">
            <TriangleAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Alarms & Status</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
            Phase 9
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-400">Active Alarms:</span>
          <span className="font-bold text-amber-400 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            {kpiSummary.totalAlerts ?? 0}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Critical Alarms:</span>
          <span className="font-bold text-rose-400 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            {kpiSummary.criticalAlerts ?? 0}
          </span>
        </div>
      </div>

      {/* Phase 10 Predictive Fleet Health */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-md">
        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-white">
            <Wrench className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Predictive Wear</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
            Phase 10
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Machinery fleet is continuously monitored with deterministic degradation scoring and RUL forecasting.
        </div>

        <Link
          to="/maintenance"
          className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold text-xs pt-1 transition-colors"
        >
          <span>Open Maintenance Module</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Quick Navigation Links */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-md">
        <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-white pb-2 border-b border-slate-800/80">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Operational Modules</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <Link
            to="/overview"
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-center"
          >
            Overview
          </Link>
          <Link
            to="/digital-twin"
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-center"
          >
            Digital Twin
          </Link>
          <Link
            to="/energy"
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-center"
          >
            Energy
          </Link>
          <Link
            to="/environment"
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-center"
          >
            Environment
          </Link>
          <Link
            to="/alerts"
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-center"
          >
            Alerts
          </Link>
          <Link
            to="/analytics"
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-center"
          >
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};
