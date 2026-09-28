import React from "react";
import { Zap, BatteryCharging, BatteryWarning, BatteryMedium, TriangleAlert, TrendingUp } from "lucide-react";
import { Card } from "../ui/Card";
import { HealthIndicator } from "../ui/HealthIndicator";
import { useStation } from "../../context/StationContext";
import { formatPower } from "../../utils/formatters";

export const KpiCardsSection: React.FC = () => {
  const { kpiSummary } = useStation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: STATION HEALTH */}
      <Card className="relative overflow-hidden border-slate-800/80 bg-slate-900/60 hover:border-emerald-500/40 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Station Health
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                {kpiSummary.healthScore}%
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {kpiSummary.healthStatus}
              </span>
            </div>
          </div>
          <HealthIndicator score={kpiSummary.healthScore} size={48} strokeWidth={4} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
            <TrendingUp className="h-3 w-3" />
            {kpiSummary.healthTrend}
          </span>
          <span className="text-[11px] text-slate-400">Life-support nominal</span>
        </div>
      </Card>

      {/* CARD 2: POWER BALANCE */}
      <Card className="relative overflow-hidden border-slate-800/80 bg-slate-900/60 hover:border-sky-500/40 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Power Balance
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-sky-300 font-mono tracking-tight">
                {kpiSummary.netPowerKw >= 0 ? `+${kpiSummary.netPowerKw}` : kpiSummary.netPowerKw}
              </span>
              <span className="text-xs font-bold text-sky-400 font-mono">kW Net</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Zap className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-2.5 text-[11px] font-mono">
          <div>
            <span className="text-slate-400">GEN: </span>
            <span className="text-emerald-400 font-semibold">{formatPower(kpiSummary.generationKw)}</span>
          </div>
          <div>
            <span className="text-slate-400">LOAD: </span>
            <span className="text-slate-200 font-semibold">{formatPower(kpiSummary.consumptionKw)}</span>
          </div>
        </div>
      </Card>

      {/* CARD 3: BATTERY RESERVE */}
      <Card className="relative overflow-hidden border-slate-800/80 bg-slate-900/60 hover:border-indigo-500/40 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Battery Bank
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-indigo-200 font-mono tracking-tight">
                {kpiSummary.batteryPercent}%
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {kpiSummary.batteryStatus === "CHARGING" ? (
              <BatteryCharging className="h-5 w-5" />
            ) : kpiSummary.batteryPercent < 50 ? (
              <BatteryWarning className="h-5 w-5 text-amber-400" />
            ) : (
              <BatteryMedium className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5 text-xs text-slate-400">
          <span className="text-[11px]">Fuel Reserves: <strong className="text-slate-200 font-mono">{kpiSummary.fuelPercent}%</strong></span>
          <span className="text-[11px] font-mono text-indigo-300">493V Bus</span>
        </div>
      </Card>

      {/* CARD 4: ACTIVE ALERTS */}
      <Card className="relative overflow-hidden border-slate-800/80 bg-slate-900/60 hover:border-amber-500/40 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Alarms
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-black font-mono tracking-tight ${
                  kpiSummary.criticalAlerts > 0
                    ? "text-red-400"
                    : kpiSummary.warningAlerts > 0
                    ? "text-amber-300"
                    : "text-slate-100"
                }`}
              >
                {kpiSummary.totalAlerts}
              </span>
              <span className="text-xs font-semibold text-slate-400">Alarms logged</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TriangleAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5 text-[11px] font-mono">
          <span className="text-red-400 font-semibold">Critical: {kpiSummary.criticalAlerts}</span>
          <span className="text-slate-700">|</span>
          <span className="text-amber-300 font-semibold">Warning: {kpiSummary.warningAlerts}</span>
          <span className="text-slate-700">|</span>
          <span className="text-sky-300 font-semibold">Info: {kpiSummary.infoAlerts}</span>
        </div>
      </Card>
    </div>
  );
};
