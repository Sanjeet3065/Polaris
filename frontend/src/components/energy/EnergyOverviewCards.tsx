/**
 * POLARIS — Energy Overview Operational Cards
 * Phase 7: Energy Monitoring
 * 
 * Displays instantaneous microgrid telemetry with standardized status thresholds.
 */

import React from "react";
import { Zap, Sun, Flame, BatteryCharging, Battery, Gauge, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { formatPower, formatPercentage } from "../../utils/formatters";
import {
  evaluateBatteryStatus,
  evaluatePowerBalanceStatus
} from "../../utils/thresholds";

export const EnergyOverviewCards: React.FC = () => {
  const { energy, realtimeStatus } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const solarGen = energy.solarGenerationKw ?? (energy as any).solarPhotovoltaicKw ?? 0;
  const dieselGen = energy.dieselGenerationKw ?? (energy as any).dieselGeneratorKw ?? 0;
  const totalGen = energy.totalGenerationKw || 1;
  const totalLoad = energy.totalConsumptionKw || 0;
  const netBalance = energy.netPowerBalanceKw;
  const batterySoc = energy.batteryPercentage;
  const batteryVolt = energy.batteryVoltageV ?? (energy as any).batteryBusVoltage ?? 490;

  // Threshold evaluations
  const batteryEval = evaluateBatteryStatus(batterySoc, batteryVolt, isOffline);
  const balanceEval = evaluatePowerBalanceStatus(netBalance, isOffline);

  // Renewable Fraction
  const renewableFraction = Math.min(100, Math.round((solarGen / totalGen) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Generation Card */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Generation</span>
        </div>
        <span className="self-start text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          {renewableFraction}% Solar
        </span>
        <div className="text-2xl font-bold font-mono text-slate-100">
          {formatPower(energy.totalGenerationKw)}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
          <div className="flex items-center gap-1">
            <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Solar: {Math.round(solarGen)} kW</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
            <span>DG: {Math.round(dieselGen)} kW</span>
          </div>
        </div>
      </Card>

      {/* 2. Total Consumption Card */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Consumption</span>
        </div>
        <span className="self-start text-[10px] font-mono px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-400">
          Active Load
        </span>
        <div className="text-2xl font-bold font-mono text-slate-100">
          {formatPower(totalLoad)}
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/70">
          <span>Grid Utilization:</span>
          <span className="font-semibold text-slate-200">
            {Math.min(100, Math.round((totalLoad / (totalGen + 1)) * 100))}%
          </span>
        </div>
      </Card>

      {/* 3. Net Power Balance Card */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Power Balance</span>
        </div>
        <span className={`self-start text-[10px] font-mono px-1.5 py-0.5 rounded border ${balanceEval.badgeClass}`}>
          {balanceEval.label}
        </span>
        <div className="flex items-center gap-2">
          <div className={`text-2xl font-bold font-mono ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {netBalance > 0 ? `+${Math.round(netBalance)} kW` : `${Math.round(netBalance)} kW`}
          </div>
          {netBalance >= 0 ? (
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
          ) : (
            <ArrowDownRight className="h-5 w-5 text-rose-400" />
          )}
        </div>
        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/70 leading-snug">
          {balanceEval.description}
        </div>
      </Card>

      {/* 4. Battery Bank SoC Card */}
      <Card className="p-4 bg-polar-900/60 border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          {energy.batteryStatus === "CHARGING" ? (
            <BatteryCharging className="h-4 w-4 text-emerald-400 animate-pulse shrink-0" />
          ) : (
            <Battery className="h-4 w-4 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-snug">
            Battery Bank
            <span className="text-[10px] font-normal text-slate-500 ml-1">(LiFePO₄)</span>
          </span>
        </div>
        <span className={`self-start text-[10px] font-mono px-1.5 py-0.5 rounded border ${batteryEval.badgeClass}`}>
          {energy.batteryStatus}
        </span>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatPercentage(batterySoc)}
          </div>
          <div className="text-xs font-mono text-slate-400">
            {batteryVolt.toFixed(1)} V DC
          </div>
        </div>
        {/* SoC visual mini-progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              batterySoc <= 20 ? "bg-rose-500" : batterySoc <= 35 ? "bg-amber-400" : "bg-emerald-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, batterySoc))}%` }}
          />
        </div>
      </Card>
    </div>
  );
};
