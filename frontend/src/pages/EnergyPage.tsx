/**
 * POLARIS — Energy & Microgrid Control Center Page
 * Phase 7: Energy + Environment Monitoring
 * 
 * Production-quality operational energy management dashboard for Maitri and Bharati stations.
 * Integrates:
 *   - Phase 2 PostgreSQL / Prisma REST API (historical energy series)
 *   - Phase 4 IoT Simulator (telemetry + scenario state)
 *   - Phase 5 WebSocket (live streaming updates)
 *   - Phase 6 Digital Twin integration
 */

import React from "react";
import { Zap, ShieldCheck, AlertTriangle } from "lucide-react";
import { useStation } from "../context/StationContext";
import {
  EnergyLiveIndicator,
  EnergyOverviewCards,
  PowerBalanceFlow,
  EnergyHistoricalChart,
  BatteryMonitoringCard,
  FuelMonitoringCard,
  GeneratorEnergyCard,
  EnergyStationComparison
} from "../components/energy";
import { evaluateOverallEnergyStatus } from "../utils/thresholds";

export const EnergyPage: React.FC = () => {
  const { selectedStation, stationInfo, energy, realtimeStatus } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const batterySoc = energy.batteryPercentage;
  const fuelPct = energy.fuelReservesPercent;
  const netPower = energy.netPowerBalanceKw;
  const fuelDays = energy.fuelAutonomyDaysRemaining ?? (energy as any).estimatedFuelDaysRemaining;

  const overallStatus = evaluateOverallEnergyStatus({
    batterySoc,
    fuelPercent: fuelPct,
    netPowerKw: netPower,
    fuelDays,
    isOffline
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Power & Microgrid Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {stationInfo.name} · {stationInfo.location.region} ({stationInfo.location.lat.toFixed(2)}°S, {stationInfo.location.lng.toFixed(2)}°E)
              </p>
            </div>
          </div>
        </div>

        {/* Live Indicator & Overall Status */}
        <div className="flex flex-wrap items-center gap-3">
          <EnergyLiveIndicator />

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
      <section aria-labelledby="energy-overview-heading">
        <h2 id="energy-overview-heading" className="sr-only">Microgrid Overview Metrics</h2>
        <EnergyOverviewCards />
      </section>

      {/* 2. Station Comparison View (Visible when station filter is 'ALL') */}
      {selectedStation === "ALL" && (
        <section aria-labelledby="station-comparison-heading">
          <h2 id="station-comparison-heading" className="sr-only">Station Energy Comparison</h2>
          <EnergyStationComparison />
        </section>
      )}

      {/* 3. Microgrid Power Balance Routing Flow */}
      <section aria-labelledby="power-flow-heading">
        <h2 id="power-flow-heading" className="sr-only">Microgrid Power Flow Diagram</h2>
        <PowerBalanceFlow />
      </section>

      {/* 4. Subsystem Deep-Dive Cards */}
      <section aria-labelledby="subsystems-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <h2 id="subsystems-heading" className="sr-only">Energy Subsystems Detail</h2>
        <BatteryMonitoringCard />
        <FuelMonitoringCard />
        <GeneratorEnergyCard />
      </section>

      {/* 5. Historical Telemetry Chart */}
      <section aria-labelledby="historical-trends-heading">
        <h2 id="historical-trends-heading" className="sr-only">Historical Energy Trends</h2>
        <EnergyHistoricalChart />
      </section>
    </div>
  );
};
