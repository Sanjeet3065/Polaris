/**
 * POLARIS — Antarctic Environment Monitoring Center Page
 * Phase 7: Energy + Environment Monitoring
 * 
 * Production-quality operational environmental monitoring dashboard for Maitri and Bharati stations.
 * Integrates:
 *   - Phase 2 PostgreSQL / Prisma REST API (historical meteorological records)
 *   - Phase 4 IoT Simulator (telemetry + scenario state)
 *   - Phase 5 WebSocket (live streaming Automatic Weather Station feeds)
 *   - Phase 6 Digital Twin integration
 */

import React from "react";
import { Wind, ShieldCheck, AlertTriangle } from "lucide-react";
import { useStation } from "../context/StationContext";
import {
  EnvironmentLiveIndicator,
  EnvironmentOverviewCards,
  EnvironmentHistoricalChart,
  WindMonitorCard,
  AtmosphericPressureCard,
  EnvironmentStationComparison
} from "../components/environment";
import { evaluateOverallEnvironmentStatus } from "../utils/thresholds";

export const EnvironmentPage: React.FC = () => {
  const { selectedStation, stationInfo, environment, realtimeStatus } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const tempC = environment.temperatureCelsius;
  const windKmh = environment.windSpeedKmh ?? (environment as any).windSpeedKmH ?? 0;
  const pressureHpa = environment.atmosphericPressureHpa ?? (environment as any).barometricPressureHpa ?? 980;
  const visibilityKm = environment.visibilityKm ?? (environment as any).opticalVisibilityKm;

  const overallStatus = evaluateOverallEnvironmentStatus({
    temperatureC: tempC,
    windSpeedKmh: windKmh,
    pressureHpa,
    visibilityKm,
    isOffline
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Wind className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Antarctic Environment Monitoring Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {stationInfo.name} · {stationInfo.location.region} ({stationInfo.location.lat.toFixed(2)}°S, {stationInfo.location.lng.toFixed(2)}°E)
              </p>
            </div>
          </div>
        </div>

        {/* Live Indicator & Overall Status */}
        <div className="flex flex-wrap items-center gap-3">
          <EnvironmentLiveIndicator />

          <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${overallStatus.badgeClass}`}>
            {overallStatus.status === "CRITICAL" ? (
              <AlertTriangle className="h-4 w-4 text-rose-400 animate-bounce" />
            ) : overallStatus.status === "WARNING" ? (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            )}
            <span className="font-semibold uppercase tracking-wider">{overallStatus.label}</span>
          </div>
        </div>
      </div>

      {/* 1. Instantaneous Overview Metrics */}
      <section aria-labelledby="environment-overview-heading">
        <h2 id="environment-overview-heading" className="sr-only">Environmental Overview Metrics</h2>
        <EnvironmentOverviewCards />
      </section>

      {/* 2. Station Comparison View (Visible when station filter is 'ALL') */}
      {selectedStation === "ALL" && (
        <section aria-labelledby="station-comparison-heading">
          <h2 id="station-comparison-heading" className="sr-only">Station Meteorological Comparison</h2>
          <EnvironmentStationComparison />
        </section>
      )}

      {/* 3. Deep-Dive Weather Instrumentation */}
      <section aria-labelledby="instrumentation-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <h2 id="instrumentation-heading" className="sr-only">Meteorological Instrumentation</h2>
        <WindMonitorCard />
        <AtmosphericPressureCard />
      </section>

      {/* 4. Historical Telemetry Chart */}
      <section aria-labelledby="historical-trends-heading">
        <h2 id="historical-trends-heading" className="sr-only">Historical Climate Trends</h2>
        <EnvironmentHistoricalChart />
      </section>
    </div>
  );
};
