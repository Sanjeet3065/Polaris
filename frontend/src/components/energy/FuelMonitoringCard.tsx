/**
 * POLARIS — Fuel Farm Monitoring Card
 * Phase 7: Energy Monitoring
 * 
 * Monitors station bulk diesel reserves and autonomy days.
 * Synchronizes with LOW_FUEL scenario and centralized thresholds.
 */

import React from "react";
import { Fuel, Droplet, AlertTriangle, Clock } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { evaluateFuelStatus } from "../../utils/thresholds";
import { formatLiters, formatPercentage } from "../../utils/formatters";

export const FuelMonitoringCard: React.FC = () => {
  const { energy, realtimeStatus, alertsList } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const fuelPercent = energy.fuelReservesPercent;
  const fuelLiters = energy.fuelReservesLiters ?? (energy as any).fuelReserveLiters ?? 0;
  const daysRemaining = energy.fuelAutonomyDaysRemaining ?? (energy as any).estimatedFuelDaysRemaining ?? 200;

  // Threshold evaluation
  const statusEval = evaluateFuelStatus(fuelPercent, daysRemaining, isOffline);

  // Check if LOW_FUEL scenario is active
  const isLowFuelScenario = alertsList.some(
    (a) => a.source === "ENERGY" && (a.title.includes("Fuel") || a.description.includes("Fuel"))
  ) || fuelPercent <= 25;

  return (
    <Card className={`p-5 bg-polar-900/60 border ${
      statusEval.status === "CRITICAL"
        ? "border-rose-500/50 bg-rose-950/15"
        : statusEval.status === "WARNING"
        ? "border-amber-500/40 bg-amber-950/10"
        : "border-slate-800/80"
    } flex flex-col justify-between`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              fuelPercent <= 20
                ? "bg-rose-500/20 text-rose-400"
                : fuelPercent <= 40
                ? "bg-amber-500/20 text-amber-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}>
              <Fuel className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Bulk Fuel Reserves
              </h4>
              <p className="text-[11px] text-slate-400">Aviation Grade Arctic Jet A-1 / Diesel</p>
            </div>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusEval.badgeClass}`}>
            {statusEval.label}
          </span>
        </div>

        {/* LOW_FUEL Scenario Warning Banner */}
        {isLowFuelScenario && (
          <div className="mt-3 p-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 flex items-center gap-2 text-xs font-mono text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">SCENARIO: LOW_FUEL ACTIVE</span>
              <div className="text-[11px] text-rose-400/90 font-sans">
                Station fuel reserve depleted past safety threshold. Cargo voyage resupply coordination required.
              </div>
            </div>
          </div>
        )}

        {/* Main Fuel Metrics */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-slate-100">
              {formatPercentage(fuelPercent)}
            </div>
            <div className="text-xs font-mono text-amber-300 mt-0.5 flex items-center gap-1">
              <Droplet className="h-3 w-3 text-amber-400" />
              <span>{formatLiters(fuelLiters)}</span>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-base font-bold text-slate-200 flex items-center justify-end gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {daysRemaining} Days
            </div>
            <div className="text-[11px] text-slate-500">Autonomy Margin</div>
          </div>
        </div>

        {/* Visual Tank Gauge */}
        <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              fuelPercent <= 20
                ? "bg-rose-500"
                : fuelPercent <= 40
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, fuelPercent))}%` }}
          />
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-5 pt-3 border-t border-slate-800/70 grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Storage Layout:</span>
          <span className="font-semibold text-slate-300">Double-Walled Arctic Tanks</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-[10px] uppercase">Safety Minimum:</span>
          <span className="font-semibold text-slate-300">20% Emergency Hold</span>
        </div>
      </div>
    </Card>
  );
};
