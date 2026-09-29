/**
 * POLARIS — Environmental Station Comparison (Maitri vs. Bharati)
 * Phase 7: Operational Station Comparison View
 * 
 * Compares actual operational meteorological telemetry side-by-side when station filter is 'ALL'.
 */

import React from "react";
import { Compass } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { MOCK_ENVIRONMENT } from "../../data/telemetry";
import { formatTemperature, formatWind, formatPressure, formatPercentage } from "../../utils/formatters";

export const EnvironmentStationComparison: React.FC = () => {
  const { liveEnvironmentByStation } = useStation();

  const maitri = liveEnvironmentByStation?.MAITRI || MOCK_ENVIRONMENT.MAITRI;
  const bharati = liveEnvironmentByStation?.BHARATI || MOCK_ENVIRONMENT.BHARATI;

  const mTemp = maitri.temperatureCelsius;
  const bTemp = bharati.temperatureCelsius;

  const mWind = maitri.windSpeedKmh ?? (maitri as any).windSpeedKmH ?? 0;
  const bWind = bharati.windSpeedKmh ?? (bharati as any).windSpeedKmH ?? 0;

  const mPress = maitri.atmosphericPressureHpa ?? (maitri as any).barometricPressureHpa ?? 980;
  const bPress = bharati.atmosphericPressureHpa ?? (bharati as any).barometricPressureHpa ?? 980;

  const mHum = maitri.humidityPercentage ?? (maitri as any).relativeHumidityPercent ?? 70;
  const bHum = bharati.humidityPercentage ?? (bharati as any).relativeHumidityPercent ?? 70;

  const mVis = maitri.visibilityKm ?? (maitri as any).opticalVisibilityKm ?? 15;
  const bVis = bharati.visibilityKm ?? (bharati as any).opticalVisibilityKm ?? 15;

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Compass className="h-4 w-4 text-sky-400" />
            Meteorological Station Comparison: Maitri vs. Bharati
          </h3>
          <p className="text-xs text-slate-400">
            Microclimates of Schirmacher Oasis (Inland Continental) vs. Larsemann Hills (Coastal Marine)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300 font-semibold">Maitri Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400"></span>
            <span className="text-slate-300 font-semibold">Bharati Station</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Maitri Column */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/15 space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <span className="text-xs font-bold font-mono uppercase text-cyan-300 tracking-wider">
              Maitri Station (Schirmacher Oasis)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Inland Rock Oasis
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">Temperature:</span>
              <span className="text-base font-bold text-cyan-200">{formatTemperature(mTemp)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Wind Velocity:</span>
              <span className="text-base font-bold text-sky-300">{formatWind(mWind)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Barometer:</span>
              <span className="text-base font-bold text-slate-200">{formatPressure(mPress)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Humidity:</span>
              <span className="text-base font-bold text-blue-300">{formatPercentage(mHum)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Visibility:</span>
              <span className="text-base font-bold text-emerald-300">{mVis.toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Wind Heading:</span>
              <span className="text-base font-bold text-slate-200">
                {maitri.windDirectionCompass || "SSE"} ({maitri.windDirectionDegrees || 155}°)
              </span>
            </div>
          </div>
        </div>

        {/* Bharati Column */}
        <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/15 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
            <span className="text-xs font-bold font-mono uppercase text-sky-300 tracking-wider">
              Bharati Station (Larsemann Hills)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
              Coastal Promontory
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">Temperature:</span>
              <span className="text-base font-bold text-cyan-200">{formatTemperature(bTemp)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Wind Velocity:</span>
              <span className="text-base font-bold text-sky-300">{formatWind(bWind)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Barometer:</span>
              <span className="text-base font-bold text-slate-200">{formatPressure(bPress)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Humidity:</span>
              <span className="text-base font-bold text-blue-300">{formatPercentage(bHum)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Visibility:</span>
              <span className="text-base font-bold text-emerald-300">{bVis.toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Wind Heading:</span>
              <span className="text-base font-bold text-slate-200">
                {bharati.windDirectionCompass || "ESE"} ({bharati.windDirectionDegrees || 110}°)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Relative Comparison Bars */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
          Atmospheric Metric Contrasts
        </div>

        {/* Wind Speed Contrast */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Wind Velocity Comparison</span>
            <span>Maitri: {formatWind(mWind)} vs Bharati: {formatWind(bWind)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-500"
              style={{ width: `${(mWind / (mWind + bWind || 1)) * 100}%` }}
              title={`Maitri Wind: ${mWind} km/h`}
            />
            <div
              className="bg-sky-400 h-full transition-all duration-500"
              style={{ width: `${(bWind / (mWind + bWind || 1)) * 100}%` }}
              title={`Bharati Wind: ${bWind} km/h`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
