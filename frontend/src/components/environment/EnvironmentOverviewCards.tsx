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
import {
  formatTemperature,
  formatWind,
  formatPressure,
  formatPercentage,
} from "../../utils/formatters";
import {
  evaluateTemperatureStatus,
  evaluateWindStatus,
  evaluatePressureStatus,
  evaluateVisibilityStatus,
} from "../../utils/thresholds";

export const EnvironmentOverviewCards: React.FC = () => {
  const { environment, realtimeStatus } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const tempC = environment.temperatureCelsius;
  const windKmh =
    environment.windSpeedKmh ?? (environment as any).windSpeedKmH ?? 0;
  const compass = environment.windDirectionCompass || "SE";
  const degrees = environment.windDirectionDegrees ?? 135;
  const pressureHpa =
    environment.atmosphericPressureHpa ??
    (environment as any).barometricPressureHpa ??
    980;
  const humidity =
    environment.humidityPercentage ??
    (environment as any).relativeHumidityPercent ??
    70;
  const visibility =
    environment.visibilityKm ?? (environment as any).opticalVisibilityKm ?? 15;
  const solarRad =
    environment.solarRadiationWattsPerM2 ??
    (environment as any).solarIrradianceWm2 ??
    120;

  // Threshold evaluations
  const tempEval = evaluateTemperatureStatus(tempC, isOffline);
  const windEval = evaluateWindStatus(windKmh, isOffline);
  const pressEval = evaluatePressureStatus(pressureHpa, isOffline);
  const visEval = evaluateVisibilityStatus(visibility, isOffline);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">

      {/* 1. Ambient Temperature */}
      <Card className="p-3 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col gap-2 shadow-sm">
        {/* Top: icon + full label */}
        <div className="flex items-center gap-1.5">
          <Thermometer className="h-3.5 w-3.5 text-orange-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
            Temperature
          </span>
        </div>
        {/* Badge below label */}
        <span className={`self-start text-[10px] font-mono px-1.5 py-0.5 rounded border ${tempEval.badgeClass}`}>
          {tempEval.label}
        </span>
        {/* Value */}
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
          {formatTemperature(tempC)}
        </div>
        {/* Description */}
        <div
          className="text-[10px] sm:text-[11px] text-slate-400 pt-2 border-t border-polar-750 leading-snug"
          title={tempEval.description}
        >
          {tempEval.description}
        </div>
      </Card>

      {/* 2. Wind Velocity & Heading */}
      <Card className="p-3 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
            Wind Velocity
          </span>
        </div>
        <span className={`self-start text-[10px] font-mono px-1.5 py-0.5 rounded border ${windEval.badgeClass}`}>
          {windEval.label}
        </span>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
          {formatWind(windKmh)}{" "}
          <span className="text-xs font-normal text-slate-400 font-sans">
            {compass} ({degrees}°)
          </span>
        </div>
        <div
          className="text-[10px] sm:text-[11px] text-slate-400 pt-2 border-t border-polar-750 leading-snug"
          title={windEval.description}
        >
          {windEval.description}
        </div>
      </Card>

      {/* 3. Barometric Pressure */}
      <Card className="p-3 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
            Barometer
          </span>
        </div>
        <span className={`self-start text-[10px] font-mono px-1.5 py-0.5 rounded border ${pressEval.badgeClass}`}>
          {pressEval.label}
        </span>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
          {formatPressure(pressureHpa)}
        </div>
        <div
          className="text-[10px] sm:text-[11px] text-slate-400 pt-2 border-t border-polar-750 leading-snug"
          title={pressEval.description}
        >
          {pressEval.description}
        </div>
      </Card>

      {/* 4. Relative Humidity */}
      <Card className="p-3 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
            Humidity
          </span>
        </div>
        <span className="self-start text-[10px] font-mono px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-300">
          RH Ambient
        </span>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
          {formatPercentage(humidity)}
        </div>
        <div
          className="text-[10px] sm:text-[11px] text-slate-400 pt-2 border-t border-polar-750 leading-snug"
          title="Low moisture polar atmosphere"
        >
          Low moisture polar atmosphere
        </div>
      </Card>

      {/* 5. Optical Visibility */}
      <Card className="p-3 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
            Visibility
          </span>
        </div>
        <span className={`self-start text-[10px] font-mono px-1.5 py-0.5 rounded border ${visEval.badgeClass}`}>
          {visEval.label}
        </span>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
          {visibility.toFixed(1)} km
        </div>
        <div
          className="text-[10px] sm:text-[11px] text-slate-400 pt-2 border-t border-polar-750 leading-snug"
          title={visEval.description}
        >
          {visEval.description}
        </div>
      </Card>

      {/* 6. Solar Irradiance */}
      <Card className="p-3 sm:p-4 bg-polar-900/80 border-polar-750 hover:border-orange-500/30 rounded-xl transition-all flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
            Solar Flux
          </span>
        </div>
        <span className="self-start text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
          Pyranometer
        </span>
        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1">
          {Math.round(solarRad)} W/m²
        </div>
        <div
          className="text-[10px] sm:text-[11px] text-slate-400 pt-2 border-t border-polar-750 leading-snug"
          title="Incident global horizontal radiation"
        >
          Incident global horizontal radiation
        </div>
      </Card>

    </div>
  );
};
