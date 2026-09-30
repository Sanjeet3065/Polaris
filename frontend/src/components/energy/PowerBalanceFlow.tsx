/**
 * POLARIS — Power Balance Flow Diagram
 * Phase 7: Real-Time Dynamic Microgrid Energy Routing
 * 
 * Visually communicates power distribution from Generation -> Central Bus -> Battery & Loads.
 */

import React from "react";
import { Zap, Sun, Flame, Battery, BatteryCharging, ArrowDown, ArrowUp, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { formatPower } from "../../utils/formatters";
import { evaluatePowerBalanceStatus } from "../../utils/thresholds";

export const PowerBalanceFlow: React.FC = () => {
  const { energy, realtimeStatus } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const solarGen = energy.solarGenerationKw ?? (energy as any).solarPhotovoltaicKw ?? 0;
  const dieselGen = energy.dieselGenerationKw ?? (energy as any).dieselGeneratorKw ?? 0;
  const totalGen = energy.totalGenerationKw || 0;
  const totalLoad = energy.totalConsumptionKw || 0;
  const netPower = energy.netPowerBalanceKw;
  const batterySoc = energy.batteryPercentage;
  const isCharging = netPower > 2.0;
  const isDischarging = netPower < -2.0;

  const balanceEval = evaluatePowerBalanceStatus(netPower, isOffline);

  return (
    <Card className="p-5 bg-polar-900/60 border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-400" />
            Station Microgrid Power Flow Architecture
          </h3>
          <p className="text-xs text-slate-400">
            Real-time energy routing between co-generation sources, central distribution bus, and storage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${balanceEval.badgeClass} flex items-center gap-1.5`}>
            {netPower < -15 ? (
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            )}
            {balanceEval.label}
          </span>
        </div>
      </div>

      {/* Grid Flow Canvas */}
      <div className="flex flex-col items-center gap-5 sm:gap-6">
        {/* TOP: GENERATION SOURCES */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Solar PV Node */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                <Sun className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-300">Solar PV Array</div>
                <div className="text-[11px] text-slate-400">Photovoltaic Fields</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-base font-bold text-amber-300">{formatPower(solarGen)}</div>
              <div className="text-[10px] text-amber-400/80">Active Inverters</div>
            </div>
          </div>

          {/* Diesel Cogeneration Node */}
          <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-500/20 text-orange-300">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-300">Arctic Diesel Gen</div>
                <div className="text-[11px] text-slate-400">DG1 & DG2 Cogeneration</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-base font-bold text-orange-300">{formatPower(dieselGen)}</div>
              <div className="text-[10px] text-orange-400/80">Thermal Heat Rec.</div>
            </div>
          </div>
        </div>

        {/* DOWN ARROW CONNECTOR */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-polar-850 border border-polar-700 text-[11px] font-mono text-emerald-400 animate-pulse">
            <ArrowDown className="h-3.5 w-3.5" />
            <span>Total Inflow: {formatPower(totalGen)}</span>
            <ArrowDown className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* MIDDLE: CENTRAL MICROGRID BUS */}
        <div className="w-full max-w-xl p-4 rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-950/30 via-polar-900 to-orange-950/30 text-center relative overflow-hidden shadow-lg shadow-orange-950/20">
          <div className="text-[11px] font-mono text-orange-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
            <Zap className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
            Central Synchronous Microgrid Bus (415V / 50Hz)
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-400">Generation: </span>
              <span className="font-bold text-emerald-400">{formatPower(totalGen)}</span>
            </div>
            <div className="hidden sm:inline text-slate-600">|</div>
            <div>
              <span className="text-slate-400">Demand: </span>
              <span className="font-bold text-amber-300">{formatPower(totalLoad)}</span>
            </div>
            <div className="hidden sm:inline text-slate-600">|</div>
            <div>
              <span className="text-slate-400">Net Flow: </span>
              <span className={`font-bold ${netPower >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {netPower > 0 ? `+${Math.round(netPower)} kW` : `${Math.round(netPower)} kW`}
              </span>
            </div>
          </div>
        </div>

        {/* BRANCHING CONNECTOR */}
        <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-1 px-3 sm:px-12 text-slate-400">
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {isCharging ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ArrowDown className="h-3.5 w-3.5 animate-bounce" /> Charge Rate ({Math.round(netPower)} kW)
              </span>
            ) : isDischarging ? (
              <span className="text-rose-400 flex items-center gap-1">
                <ArrowUp className="h-3.5 w-3.5 animate-bounce" /> Discharge Draw ({Math.abs(Math.round(netPower))} kW)
              </span>
            ) : (
              <span className="text-slate-400">Float Voltage Steady</span>
            )}
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] text-orange-400">
            <span>Primary Load Routing ({formatPower(totalLoad)})</span>
            <ArrowDown className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* BOTTOM: STORAGE & CONSUMPTION LOADS */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Battery Storage Node */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            isCharging ? "border-emerald-500/40 bg-emerald-500/10" : isDischarging ? "border-amber-500/40 bg-amber-500/10" : "border-slate-800 bg-slate-900/60"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCharging ? (
                  <BatteryCharging className="h-4 w-4 text-emerald-400 animate-pulse" />
                ) : (
                  <Battery className="h-4 w-4 text-amber-400" />
                )}
                <span className="text-xs font-semibold text-slate-200">Battery Bank</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-100">{batterySoc}% SoC</span>
            </div>

            <div className="mt-3 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Bus Voltage:</span>
                <span className="text-slate-200">{(energy.batteryVoltageV ?? 490).toFixed(1)} V</span>
              </div>
              <div className="flex justify-between">
                <span>Operation:</span>
                <span className={isCharging ? "text-emerald-400 font-semibold" : isDischarging ? "text-rose-400 font-semibold" : "text-slate-300"}>
                  {energy.batteryStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Station Loads Node */}
          <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-semibold text-slate-200">Station Demand</span>
              </div>
              <span className="text-xs font-mono font-bold text-sky-300">{formatPower(totalLoad)}</span>
            </div>

            <div className="mt-3 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Life Support & Heat:</span>
                <span className="text-slate-200">~{Math.round(totalLoad * 0.45)} kW</span>
              </div>
              <div className="flex justify-between">
                <span>Laboratories & Tech:</span>
                <span className="text-slate-200">~{Math.round(totalLoad * 0.35)} kW</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
