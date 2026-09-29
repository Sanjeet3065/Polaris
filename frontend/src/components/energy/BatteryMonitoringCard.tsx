/**
 * POLARIS — Battery Subsystem Monitoring Card
 * Phase 7: Energy Monitoring
 * 
 * Monitors station Lithium-Iron-Phosphate (LiFePO4) storage banks.
 * Synchronizes with BATTERY_LOW scenario and centralized thresholds.
 */

import React from "react";
import { Battery, BatteryCharging, BatteryWarning, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { evaluateBatteryStatus } from "../../utils/thresholds";
import { formatPercentage } from "../../utils/formatters";

export const BatteryMonitoringCard: React.FC = () => {
  const { energy, realtimeStatus, alertsList } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const batterySoc = energy.batteryPercentage;
  const batteryVolt = energy.batteryVoltageV ?? (energy as any).batteryBusVoltage ?? 490;
  const batteryStatus = energy.batteryStatus;

  // Threshold evaluation
  const statusEval = evaluateBatteryStatus(batterySoc, batteryVolt, isOffline);

  // Check if BATTERY_LOW scenario / alert is active
  const isBatteryLowScenario = alertsList.some(
    (a) => a.source === "ENERGY" && (a.title.includes("Battery") || a.description.includes("discharge"))
  ) || batterySoc <= 25;

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
              batteryStatus === "CHARGING"
                ? "bg-emerald-500/20 text-emerald-400"
                : batterySoc <= 20
                ? "bg-rose-500/20 text-rose-400"
                : "bg-amber-500/20 text-amber-400"
            }`}>
              {batteryStatus === "CHARGING" ? (
                <BatteryCharging className="h-4 w-4 animate-pulse" />
              ) : batterySoc <= 20 ? (
                <BatteryWarning className="h-4 w-4" />
              ) : (
                <Battery className="h-4 w-4" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Sub-Zero Battery Bank
              </h4>
              <p className="text-[11px] text-slate-400">Station Thermal Battery Enclosure</p>
            </div>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusEval.badgeClass}`}>
            {statusEval.label}
          </span>
        </div>

        {/* BATTERY_LOW Scenario Warning Banner */}
        {isBatteryLowScenario && (
          <div className="mt-3 p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-center gap-2 text-xs font-mono text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">SCENARIO: BATTERY_LOW ACTIVE</span>
              <div className="text-[11px] text-amber-400/90 font-sans">
                Accelerated discharge detected. Secondary diesel generator throttling engaged.
              </div>
            </div>
          </div>
        )}

        {/* Main SoC Metric */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-slate-100">
              {formatPercentage(batterySoc)}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Operating State: <span className="font-semibold text-slate-200">{batteryStatus}</span>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-sm font-bold text-slate-200">{batteryVolt.toFixed(1)} V DC</div>
            <div className="text-[11px] text-slate-500">Nominal 480V DC Bus</div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              batterySoc <= 20
                ? "bg-rose-500"
                : batterySoc <= 35
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, batterySoc))}%` }}
          />
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-5 pt-3 border-t border-slate-800/70 grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Safety Cutoff:</span>
          <span className="font-semibold text-slate-300">20% Minimum DoD</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-[10px] uppercase">Bank Topology:</span>
          <span className="font-semibold text-slate-300">480V / 240 kWh LiFePO4</span>
        </div>
      </div>
    </Card>
  );
};
