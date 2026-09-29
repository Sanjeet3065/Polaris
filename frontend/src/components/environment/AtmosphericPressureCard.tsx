/**
 * POLARIS — Atmospheric Pressure & Blizzard Early Warning Card
 * Phase 7: Environment Monitoring
 * 
 * Monitors barometric pressure trends to detect incoming polar cyclonic depressions.
 */

import React from "react";
import { Gauge, ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { evaluatePressureStatus } from "../../utils/thresholds";
import { formatPressure } from "../../utils/formatters";

export const AtmosphericPressureCard: React.FC = () => {
  const { environment, realtimeStatus } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const pressureHpa = environment.atmosphericPressureHpa ?? (environment as any).barometricPressureHpa ?? 980;

  const statusEval = evaluatePressureStatus(pressureHpa, isOffline);

  // Pressure tendency classification
  let tendency = "Steady";
  let tendencyColor = "text-slate-400";
  if (pressureHpa < 960) {
    tendency = "Severe Rapid Drop";
    tendencyColor = "text-rose-400";
  } else if (pressureHpa < 975) {
    tendency = "Depression Front";
    tendencyColor = "text-amber-400";
  } else if (pressureHpa > 995) {
    tendency = "High Pressure Ridge";
    tendencyColor = "text-emerald-400";
  }

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
              statusEval.status === "CRITICAL"
                ? "bg-rose-500/20 text-rose-400"
                : statusEval.status === "WARNING"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-indigo-500/20 text-indigo-400"
            }`}>
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Atmospheric Pressure
              </h4>
              <p className="text-[11px] text-slate-400">Precision Solid-State Barometer</p>
            </div>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusEval.badgeClass}`}>
            {statusEval.label}
          </span>
        </div>

        {/* Rapid Drop Warning Banner */}
        {pressureHpa < 965 && (
          <div className="mt-3 p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-center gap-2 text-xs font-mono text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">BAROMETRIC DEPRESSION DETECTED</span>
              <div className="text-[11px] text-amber-400/90 font-sans">
                Sub-965 hPa pressure indicates impending cyclonic front and blizzard escalation.
              </div>
            </div>
          </div>
        )}

        {/* Main Pressure Metric */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-slate-100">
              {formatPressure(pressureHpa)}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Tendency:</span>
              <span className={`font-semibold ${tendencyColor} flex items-center gap-0.5`}>
                {pressureHpa < 975 ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
                {tendency}
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-sm font-bold text-slate-200">{(pressureHpa * 0.750062).toFixed(1)} mmHg</div>
            <div className="text-[11px] text-slate-500">Sea Level Corrected</div>
          </div>
        </div>

        {/* Pressure range visual indicator */}
        <div className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pressureHpa <= 955 ? "bg-rose-500" : pressureHpa <= 970 ? "bg-amber-400" : "bg-indigo-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, ((pressureHpa - 930) / (1020 - 930)) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
          <span>930 hPa (Deep Low)</span>
          <span>980 hPa (Standard)</span>
          <span>1020 hPa (Ridge)</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Blizzard Precursor Index:</span>
        <span className={pressureHpa < 965 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
          {pressureHpa < 965 ? "High Threat Level" : "Low Threat Level"}
        </span>
      </div>
    </Card>
  );
};
