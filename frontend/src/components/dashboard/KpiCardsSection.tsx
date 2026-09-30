import React from "react";
import { Zap, BatteryCharging, BatteryWarning, BatteryMedium, TriangleAlert, TrendingUp } from "lucide-react";
import { Card } from "../ui/Card";
import { HealthIndicator } from "../ui/HealthIndicator";
import { useStation } from "../../context/StationContext";
import { formatPower } from "../../utils/formatters";

export const KpiCardsSection: React.FC = () => {
  const { kpiSummary } = useStation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* CARD 1: STATION HEALTH */}
      <Card className="relative overflow-hidden border-polar-750 bg-polar-900/75 hover:border-emerald-500/40 shadow-titanium transition-all duration-200 p-4 sm:p-5">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/60" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              System Health
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                {kpiSummary.healthScore}%
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                {kpiSummary.healthStatus}
              </span>
            </div>
          </div>
          <HealthIndicator score={kpiSummary.healthScore} size={46} strokeWidth={4} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-polar-750 pt-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
            <TrendingUp className="h-3 w-3" />
            {kpiSummary.healthTrend}
          </span>
          <span className="text-[10px] font-mono text-slate-400">NOMINAL OPS</span>
        </div>
      </Card>

      {/* CARD 2: POWER BALANCE */}
      <Card className="relative overflow-hidden border-polar-750 bg-polar-900/75 hover:border-orange-500/40 shadow-sm transition-all duration-200 p-4 sm:p-5">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Power Balance
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-orange-400 font-mono tracking-tight tabular-nums">
                {kpiSummary.netPowerKw >= 0 ? `+${kpiSummary.netPowerKw}` : kpiSummary.netPowerKw}
              </span>
              <span className="text-xs font-bold text-orange-400 font-mono">kW Net</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-polar-800 text-orange-400 border border-orange-500/25">
            <Zap className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-polar-750 pt-2.5 text-[11px] font-mono">
          <div>
            <span className="text-slate-400 text-[10px]">GEN: </span>
            <span className="text-emerald-400 font-semibold tabular-nums">{formatPower(kpiSummary.generationKw)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">LOAD: </span>
            <span className="text-slate-200 font-semibold tabular-nums">{formatPower(kpiSummary.consumptionKw)}</span>
          </div>
        </div>
      </Card>

      {/* CARD 3: BATTERY RESERVE */}
      <Card className="relative overflow-hidden border-polar-750 bg-polar-900/75 hover:border-slate-500/40 shadow-sm transition-all duration-200 p-4 sm:p-5">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/80" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Battery Bank
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                {kpiSummary.batteryPercent}%
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                  kpiSummary.batteryStatus === "CHARGING"
                    ? "text-emerald-400"
                    : kpiSummary.batteryStatus === "DISCHARGING"
                    ? "text-amber-400"
                    : "text-slate-300"
                }`}
              >
                {kpiSummary.batteryStatus}
              </span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-polar-800 text-emerald-400 border border-polar-700">
            {kpiSummary.batteryStatus === "CHARGING" ? (
              <BatteryCharging className="h-5 w-5" />
            ) : kpiSummary.batteryPercent < 50 ? (
              <BatteryWarning className="h-5 w-5 text-amber-400" />
            ) : (
              <BatteryMedium className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-polar-750 pt-2.5 text-xs text-slate-400 font-mono">
          <span className="text-[10px]">Fuel: <strong className="text-slate-200 tabular-nums">{kpiSummary.fuelPercent}%</strong></span>
          <span className="text-[10px] text-slate-400">493V Bus</span>
        </div>
      </Card>

      {/* CARD 4: ACTIVE ALERTS */}
      <Card className="relative overflow-hidden border-polar-750 bg-polar-900/75 hover:border-amber-500/40 shadow-sm transition-all duration-200 p-4 sm:p-5">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Active Alarms
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-black font-mono tracking-tight tabular-nums ${
                  kpiSummary.criticalAlerts > 0
                    ? "text-rose-400"
                    : kpiSummary.warningAlerts > 0
                    ? "text-amber-300"
                    : "text-slate-100"
                }`}
              >
                {kpiSummary.totalAlerts}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">Telemetry Events</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-polar-800 text-amber-400 border border-amber-500/25">
            <TriangleAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-polar-750 pt-2.5 text-[10px] font-mono">
          <span className="text-rose-400 font-semibold">Crit: {kpiSummary.criticalAlerts}</span>
          <span className="text-polar-700">|</span>
          <span className="text-amber-300 font-semibold">Warn: {kpiSummary.warningAlerts}</span>
          <span className="text-polar-700">|</span>
          <span className="text-slate-300 font-semibold">Info: {kpiSummary.infoAlerts}</span>
        </div>
      </Card>
    </div>
  );
};
