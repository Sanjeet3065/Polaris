/**
 * POLARIS — Wind & Katabatic Gale Monitoring Card
 * Phase 7: Environment Monitoring
 * 
 * Monitors station anemometer readings and wind vector heading.
 * Synchronizes with HIGH_WIND scenario and centralized thresholds.
 */

import React from "react";
import { Wind, Navigation, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { useStation } from "../../context/StationContext";
import { evaluateWindStatus } from "../../utils/thresholds";
import { formatWind } from "../../utils/formatters";

export const WindMonitorCard: React.FC = () => {
  const { environment, realtimeStatus, alertsList } = useStation();

  const isOffline = realtimeStatus === "OFFLINE";
  const windKmh = environment.windSpeedKmh ?? (environment as any).windSpeedKmH ?? 0;
  const compass = environment.windDirectionCompass || "SE";
  const degrees = environment.windDirectionDegrees ?? 135;

  const statusEval = evaluateWindStatus(windKmh, isOffline);

  // Check if HIGH_WIND scenario or blizzard alert is active
  const isHighWindScenario = alertsList.some(
    (a) => a.source === "ENVIRONMENT" && (a.title.includes("Wind") || a.title.includes("Blizzard") || a.description.includes("Katabatic"))
  ) || windKmh >= 70;

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
                : "bg-sky-500/20 text-sky-400"
            }`}>
              <Wind className={`h-4 w-4 ${isHighWindScenario ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Katabatic Anemometry
              </h4>
              <p className="text-[11px] text-slate-400">Ultrasonic Polar Wind Vane</p>
            </div>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusEval.badgeClass}`}>
            {statusEval.label}
          </span>
        </div>

        {/* HIGH_WIND Scenario Warning Banner */}
        {isHighWindScenario && (
          <div className="mt-3 p-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 flex items-center gap-2 text-xs font-mono text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">SCENARIO: HIGH_WIND / BLIZZARD ACTIVE</span>
              <div className="text-[11px] text-rose-400/90 font-sans">
                Extreme Katabatic gusts exceeding safety envelope. Outdoor field operations suspended.
              </div>
            </div>
          </div>
        )}

        {/* Speed & Direction Visual Layout */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-slate-100">
              {formatWind(windKmh)}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Heading: <span className="font-semibold text-slate-200">{degrees}° {compass}</span>
            </div>
          </div>

          {/* Compass Rose Dial Graphic */}
          <div className="relative h-16 w-16 rounded-full border border-slate-700 bg-slate-950/80 flex items-center justify-center shadow-inner">
            <span className="absolute top-1 text-[9px] font-bold text-slate-500">N</span>
            <span className="absolute bottom-1 text-[9px] font-bold text-slate-500">S</span>
            <span className="absolute left-1.5 text-[9px] font-bold text-slate-500">W</span>
            <span className="absolute right-1.5 text-[9px] font-bold text-slate-500">E</span>

            {/* Needle Rotating with degrees */}
            <div
              className="transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${degrees}deg)` }}
            >
              <Navigation className="h-6 w-6 text-sky-400 fill-sky-400/30" />
            </div>
          </div>
        </div>

        {/* Gauge Progress Bar */}
        <div className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              windKmh >= 80 ? "bg-rose-500" : windKmh >= 50 ? "bg-amber-400" : "bg-sky-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (windKmh / 120) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
          <span>0 km/h</span>
          <span>50 km/h (Gale)</span>
          <span>80+ km/h (Blizzard)</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Katabatic Drainage:</span>
        <span className="text-slate-200 font-semibold">Continental Plateau Slope</span>
      </div>
    </Card>
  );
};
