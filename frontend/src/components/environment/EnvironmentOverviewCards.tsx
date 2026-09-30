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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3.5 sm:gap-4">
      {/* 1. Ambient Temperature */}
      <Card className="p-3.5 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col justify-between shadow-sm min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 min-w-0 truncate">
            <Thermometer className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="truncate">Temperature</span>
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${tempEval.badgeClass}`}>
            {tempEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatTemperature(tempC)}
          </div>
          <div className="mt-2 text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-polar-750 line-clamp-1" title={tempEval.description}>
            {tempEval.description}
          </div>
        </div>
      </Card>

      {/* 2. Wind Velocity & Heading */}
      <Card className="p-3.5 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col justify-between shadow-sm min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 min-w-0 truncate">
            <Wind className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="truncate">Wind Velocity</span>
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${windEval.badgeClass}`}>
            {windEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100 flex items-baseline gap-1.5 min-w-0">
            <span>{formatWind(windKmh)}</span>
            <span className="text-xs font-normal text-slate-400 font-sans truncate">{compass} ({degrees}°)</span>
          </div>
          <div className="mt-2 text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-polar-750 line-clamp-1" title={windEval.description}>
            {windEval.description}
          </div>
        </div>
      </Card>

      {/* 3. Barometric Pressure */}
      <Card className="p-3.5 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col justify-between shadow-sm min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 min-w-0 truncate">
            <Gauge className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="truncate">Barometer</span>
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${pressEval.badgeClass}`}>
            {pressEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatPressure(pressureHpa)}
          </div>
          <div className="mt-2 text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-polar-750 line-clamp-1" title={pressEval.description}>
            {pressEval.description}
          </div>
        </div>
      </Card>

      {/* 4. Relative Humidity */}
      <Card className="p-3.5 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col justify-between shadow-sm min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 min-w-0 truncate">
            <Droplets className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="truncate">Humidity</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-300 whitespace-nowrap shrink-0">
            RH Ambient
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatPercentage(humidity)}
          </div>
          <div className="mt-2 text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-polar-750 line-clamp-1" title="Low moisture polar atmosphere">
            Low moisture polar atmosphere
          </div>
        </div>
      </Card>

      {/* 5. Optical Visibility */}
      <Card className="p-3.5 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col justify-between shadow-sm min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 min-w-0 truncate">
            <Eye className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">Visibility</span>
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${visEval.badgeClass}`}>
            {visEval.label}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {visibility.toFixed(1)} km
          </div>
          <div className="mt-2 text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-polar-750 line-clamp-1" title={visEval.description}>
            {visEval.description}
          </div>
        </div>
      </Card>

      {/* 6. Solar Irradiance */}
      <Card className="p-3.5 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col justify-between shadow-sm min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 min-w-0 truncate">
            <Sun className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="truncate">Solar Flux</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 whitespace-nowrap shrink-0">
            Pyranometer
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-amber-300">
            {Math.round(solarRad)} W/m²
          </div>
          <div className="mt-2 text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-polar-750 line-clamp-1" title="Incident global horizontal radiation">
            Incident global horizontal radiation
          </div>
        </div>
      </Card>
    </div>
  );
};
