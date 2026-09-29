import React from "react";
import {
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  Zap,
  Battery,
  Fuel,
  Users,
  Calendar,
  Activity,
  Layers
} from "lucide-react";
import { Station, EnvironmentalTelemetry, EnergyTelemetry, Alert } from "../../types";

interface Props {
  station: Station;
  environment: EnvironmentalTelemetry;
  energy: EnergyTelemetry;
  alerts: Alert[];
  equipmentCount: number;
}

export const StationInfoPanel: React.FC<Props> = ({
  station,
  environment,
  energy,
  alerts,
  equipmentCount
}) => {
  const criticalCount = alerts.filter(
    (a) => a.severity === "CRITICAL" || a.severity === "EMERGENCY"
  ).length;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-slate-100 overflow-y-auto">
      {/* Station Name & Tagline */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
            Digital Twin Station Monitor
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            {station.code}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          {station.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
          {station.tagline}
        </p>
      </div>

      {/* Operational Status & Health Card */}
      <div className="my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Operational State</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Activity className="w-3.5 h-3.5" />
            {station.operationalStatus}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block mb-1">System Health</span>
          <span
            className={`text-2xl font-black font-mono ${
              station.systemHealthPercent >= 90
                ? "text-emerald-400"
                : station.systemHealthPercent >= 75
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {station.systemHealthPercent}%
          </span>
        </div>
      </div>

      {/* Station Environmental Telemetry */}
      <div className="space-y-3 mb-4">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
          Meteorological Telemetry
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Thermometer className="w-3.5 h-3.5 text-blue-400" />
              <span>Ambient Temp</span>
            </div>
            <span className="text-lg font-bold font-mono text-white">
              {environment.temperatureCelsius}°C
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Katabatic Wind</span>
            </div>
            <span className="text-lg font-bold font-mono text-white">
              {environment.windSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Droplets className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rel. Humidity</span>
            </div>
            <span className="text-lg font-bold font-mono text-white">
              {environment.humidityPercentage}%
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>Pressure</span>
            </div>
            <span className="text-lg font-bold font-mono text-white">
              {environment.atmosphericPressureHpa} <span className="text-xs font-normal text-slate-400">hPa</span>
            </span>
          </div>
        </div>
      </div>

      {/* Microgrid & Energy Infrastructure */}
      <div className="space-y-3 mb-4">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
          Microgrid & Life Support Reserves
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Generation</span>
            </div>
            <span className="text-base font-bold font-mono text-white">
              {energy.totalGenerationKw} kW
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Consumption</span>
            </div>
            <span className="text-base font-bold font-mono text-white">
              {energy.totalConsumptionKw} kW
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>Battery Bank</span>
            </div>
            <span className="text-base font-bold font-mono text-white">
              {energy.batteryPercentage}%
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Fuel className="w-3.5 h-3.5 text-yellow-400" />
              <span>Fuel Reserves</span>
            </div>
            <span className="text-base font-bold font-mono text-white">
              {energy.fuelReservesPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Station Personnel & Commissioning Metadata */}
      <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400 mb-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Crew: <strong className="text-white">{station.currentPersonnelCount}</strong> / {station.personnelCapacity}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Built: <strong className="text-white">{station.commissionedYear}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Assets: <strong className="text-white">{equipmentCount}</strong></span>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="mt-auto pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Active Alerts ({alerts.length})
            </span>
            {criticalCount > 0 && (
              <span className="text-[10px] font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-500/30 animate-pulse">
                {criticalCount} CRITICAL
              </span>
            )}
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {alerts.slice(0, 3).map((alt) => (
              <div
                key={alt.id}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] flex items-center gap-2"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    alt.severity === "CRITICAL" || alt.severity === "EMERGENCY"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                />
                <span className="truncate text-slate-200">{alt.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
