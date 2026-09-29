/**
 * POLARIS — Environmental Overview Operational Cards
 * Phase 7: Environment Monitoring
 * 
 * Displays live microclimate telemetry from station Automatic Weather Stations (AWS).
 */

import React from "react";
import { Thermometer, Wind, Gauge, Droplets, Eye, Sun } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { formatTemperature, formatWind, formatPressure, formatPercentage } from "../../utils/formatters";
import {
  evaluateTemperatureStatus,
  evaluateWindStatus,
  evaluatePressureStatus,
  evaluateVisibilityStatus
} from "../../utils/thresholds";

export const EnvironmentOverviewCards: React.FC = () => {
  const { environment, realtimeStatus } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const tempC = environment.temperatureCelsius;
  const windKmh = environment.windSpeedKmh ?? (environment as any).windSpeedKmH ?? 0;
  const compass = environment.windDirectionCompass || "SE";
  const degrees = environment.windDirectionDegrees ?? 135;
  const pressureHpa = environment.atmosphericPressureHpa ?? (environment as any).barometricPressureHpa ?? 980;
  const humidity = environment.humidityPercentage ?? (environment as any).relativeHumidityPercent ?? 70;
  const visibility = environment.visibilityKm ?? (environment as any).opticalVisibilityKm ?? 15;
  const solarRad = environment.solarRadiationWattsPerM2 ?? (environment as any).solarIrradianceWm2 ?? 120;

  // Threshold evaluations
  const tempEval = evaluateTemperatureStatus(tempC, isOffline);
  const windEval = evaluateWindStatus(windKmh, isOffline);
  const pressEval = evaluatePressureStatus(pressureHpa, isOffline);
  const visEval = evaluateVisibilityStatus(visibility, isOffline);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Ambient Temperature */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="h-4 w-4 text-cyan-400" />
            Temperature
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tempEval.badgeClass}`}>
            {tempEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-cyan-200">
            {formatTemperature(tempC)}
          </div>
          <div className="mt-2 text-xs text-slate-400 pt-2 border-t border-slate-800/70 truncate">
            {tempEval.description}
          </div>
        </div>
      </Card>

      {/* 2. Wind Velocity & Heading */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="h-4 w-4 text-sky-400" />
            Wind Velocity
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${windEval.badgeClass}`}>
            {windEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100 flex items-baseline gap-1.5">
            <span>{formatWind(windKmh)}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">{compass} ({degrees}°)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 pt-2 border-t border-slate-800/70 truncate">
            {windEval.description}
          </div>
        </div>
      </Card>

      {/* 3. Barometric Pressure */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-indigo-400" />
            Barometer
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${pressEval.badgeClass}`}>
            {pressEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatPressure(pressureHpa)}
          </div>
          <div className="mt-2 text-xs text-slate-400 pt-2 border-t border-slate-800/70 truncate">
            {pressEval.description}
          </div>
        </div>
      </Card>

      {/* 4. Relative Humidity */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="h-4 w-4 text-blue-400" />
            Humidity
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
            RH Ambient
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatPercentage(humidity)}
          </div>
          <div className="mt-2 text-xs text-slate-400 pt-2 border-t border-slate-800/70 truncate">
            Low moisture polar air
          </div>
        </div>
      </Card>

      {/* 5. Optical Visibility */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-emerald-400" />
            Visibility
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${visEval.badgeClass}`}>
            {visEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {visibility.toFixed(1)} km
          </div>
          <div className="mt-2 text-xs text-slate-400 pt-2 border-t border-slate-800/70 truncate">
            {visEval.description}
          </div>
        </div>
      </Card>

      {/* 6. Solar Irradiance */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="h-4 w-4 text-amber-400" />
            Solar Flux
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
            Pyranometer
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-amber-300">
            {Math.round(solarRad)} W/m²
          </div>
          <div className="mt-2 text-xs text-slate-400 pt-2 border-t border-slate-800/70 truncate">
            Incident global horizontal radiation
          </div>
        </div>
      </Card>
    </div>
  );
};
