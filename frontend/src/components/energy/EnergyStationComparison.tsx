/**
 * POLARIS — Energy Station Comparison (Maitri vs. Bharati)
 * Phase 7: Operational Station Comparison View
 * 
 * Compares actual operational energy telemetry side-by-side when station filter is 'ALL'.
 */

import React from "react";
import { Compass } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { MOCK_ENERGY } from "../../data/energy";
import { formatPower, formatLiters, formatPercentage } from "../../utils/formatters";

export const EnergyStationComparison: React.FC = () => {
  const { liveEnergyByStation } = useStation();

  const maitri = liveEnergyByStation?.MAITRI || MOCK_ENERGY.MAITRI;
  const bharati = liveEnergyByStation?.BHARATI || MOCK_ENERGY.BHARATI;

  const mGen = maitri.totalGenerationKw || 0;
  const bGen = bharati.totalGenerationKw || 0;

  const mLoad = maitri.totalConsumptionKw || 0;
  const bLoad = bharati.totalConsumptionKw || 0;

  const mNet = maitri.netPowerBalanceKw || 0;
  const bNet = bharati.netPowerBalanceKw || 0;

  const mSoc = maitri.batteryPercentage || 0;
  const bSoc = bharati.batteryPercentage || 0;

  const mFuel = maitri.fuelReservesPercent || 0;
  const bFuel = bharati.fuelReservesPercent || 0;

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            Operational Station Comparison: Maitri vs. Bharati
          </h3>
          <p className="text-xs text-slate-400">
            Real-time power balance, generation capacities, battery state, and fuel reserves side-by-side
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300 font-semibold">Maitri Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400"></span>
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
              Active Microgrid
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">Generation:</span>
              <span className="text-base font-bold text-emerald-400">{formatPower(mGen)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Demand:</span>
              <span className="text-base font-bold text-sky-400">{formatPower(mLoad)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Net Balance:</span>
              <span className={`text-base font-bold ${mNet >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {mNet > 0 ? `+${Math.round(mNet)} kW` : `${Math.round(mNet)} kW`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Battery SoC:</span>
              <span className="text-base font-bold text-amber-300">{formatPercentage(mSoc)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Fuel Reserves:</span>
              <span className="text-base font-bold text-orange-300">{formatPercentage(mFuel)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Autonomy:</span>
              <span className="text-base font-bold text-slate-200">
                {maitri.fuelAutonomyDaysRemaining ?? (maitri as any).estimatedFuelDaysRemaining ?? 218} Days
              </span>
            </div>
          </div>
        </div>

        {/* Bharati Column */}
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/15 space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
            <span className="text-xs font-bold font-mono uppercase text-indigo-300 tracking-wider">
              Bharati Station (Larsemann Hills)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Active Microgrid
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">Generation:</span>
              <span className="text-base font-bold text-emerald-400">{formatPower(bGen)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Demand:</span>
              <span className="text-base font-bold text-sky-400">{formatPower(bLoad)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Net Balance:</span>
              <span className={`text-base font-bold ${bNet >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {bNet > 0 ? `+${Math.round(bNet)} kW` : `${Math.round(bNet)} kW`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Battery SoC:</span>
              <span className="text-base font-bold text-amber-300">{formatPercentage(bSoc)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Fuel Reserves:</span>
              <span className="text-base font-bold text-orange-300">{formatPercentage(bFuel)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Autonomy:</span>
              <span className="text-base font-bold text-slate-200">
                {bharati.fuelAutonomyDaysRemaining ?? (bharati as any).estimatedFuelDaysRemaining ?? 195} Days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Relative Comparison Bars */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
          Normalized Microgrid Metric Ratios
        </div>

        {/* Generation Comparison Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Power Generation</span>
            <span>Maitri: {formatPower(mGen)} vs Bharati: {formatPower(bGen)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-500"
              style={{ width: `${(mGen / (mGen + bGen || 1)) * 100}%` }}
              title={`Maitri: ${Math.round((mGen / (mGen + bGen || 1)) * 100)}%`}
            />
            <div
              className="bg-indigo-400 h-full transition-all duration-500"
              style={{ width: `${(bGen / (mGen + bGen || 1)) * 100}%` }}
              title={`Bharati: ${Math.round((bGen / (mGen + bGen || 1)) * 100)}%`}
            />
          </div>
        </div>

        {/* Fuel Storage Comparison Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Bulk Fuel Reserves</span>
            <span>Maitri: {formatLiters(maitri.fuelReservesLiters ?? 81600)} vs Bharati: {formatLiters(bharati.fuelReservesLiters ?? 73200)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-500"
              style={{ width: `${((maitri.fuelReservesLiters ?? 81600) / ((maitri.fuelReservesLiters ?? 81600) + (bharati.fuelReservesLiters ?? 73200) || 1)) * 100}%` }}
              title="Maitri Bulk Fuel"
            />
            <div
              className="bg-indigo-400 h-full transition-all duration-500"
              style={{ width: `${((bharati.fuelReservesLiters ?? 73200) / ((maitri.fuelReservesLiters ?? 81600) + (bharati.fuelReservesLiters ?? 73200) || 1)) * 100}%` }}
              title="Bharati Bulk Fuel"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
