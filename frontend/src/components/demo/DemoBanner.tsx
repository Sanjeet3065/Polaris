/**
 * POLARIS — SIH Demo Mode Banner
 * Phase 16: Persistent top bar displaying real-time demo status, progress, and controls
 */

import React from "react";
import {
  Play,
  Square,
  RotateCcw,
  Info,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { SIHDemoModal } from "./SIHDemoModal";

export const DemoBanner: React.FC = () => {
  const {
    isDemoActive,
    isCompleted,
    currentAct,
    actLabel,
    actIcon,
    elapsedSeconds,
    progressPercent,
    totalDurationSeconds,
    narrative,
    openLaunchModal,
    stopDemo,
    resetDemo,
    startDemo,
    isStarting,
    isStopping
  } = useDemo();

  return (
    <>
      <SIHDemoModal />

      {/* STATE 1: DEMO ACTIVE */}
      {isDemoActive && (
        <div
          role="status"
          aria-live="polite"
          className="w-full border-b border-amber-500/30 bg-gradient-to-r from-amber-950/80 via-polar-900/95 to-amber-950/80 px-3 sm:px-6 py-2 text-xs shadow-hud backdrop-blur-xl sticky top-0 z-30 transition-all"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 gap-x-3">
            {/* Left: Active Act & Narrative */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold text-amber-300 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>DEMO ACTIVE</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="text-sm shrink-0">{actIcon}</span>
                <span className="font-bold text-white text-xs truncate">
                  Act {currentAct}/5: <span className="text-amber-300 font-semibold">{actLabel}</span>
                </span>
                <span className="hidden lg:inline text-polar-700">•</span>
                <span className="hidden lg:inline text-slate-300 text-[11px] truncate max-w-md">
                  {narrative}
                </span>
              </div>
            </div>

            {/* Right: Progress, Timer & Controls */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 font-mono">
              {/* Progress Bar & Countdown */}
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
                <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-200 font-bold tabular-nums">
                  T+{elapsedSeconds}s / {totalDurationSeconds}s
                </span>
                <div className="hidden sm:block w-20 h-1.5 bg-polar-850 rounded-full overflow-hidden border border-amber-500/30">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />
                </div>
                <span className="text-slate-400 text-[10px] hidden sm:inline tabular-nums">
                  {progressPercent}%
                </span>
              </div>

              {/* View Timeline Details */}
              <button
                type="button"
                onClick={openLaunchModal}
                className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                title="View 5-Act Narrative Arc"
                aria-label="View 5-Act Narrative Arc"
              >
                <Info className="h-4 w-4" />
              </button>

              {/* Stop Demo Button */}
              <button
                type="button"
                disabled={isStopping}
                onClick={() => stopDemo()}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg border border-rose-500/40 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-[10px] sm:text-[11px] font-bold transition-all disabled:opacity-50"
              >
                {isStopping ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Square className="h-3 w-3 fill-rose-400 text-rose-400" />
                )}
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: DEMO COMPLETED */}
      {isCompleted && (
        <div
          role="status"
          aria-live="polite"
          className="w-full border-b border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-polar-900/95 to-emerald-950/80 px-3 sm:px-6 py-2 text-xs shadow-hud backdrop-blur-xl sticky top-0 z-30 transition-all"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 gap-x-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-white text-xs">
                  SIH Demo Stabilized:
                </span>
                <span className="text-emerald-300 text-[11px] truncate">
                  Cascade incident evaluated across all subsystems.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startDemo()}
                disabled={isStarting}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 text-[11px] font-semibold transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Re-run</span>
              </button>
              <button
                type="button"
                onClick={resetDemo}
                className="px-2.5 py-1 rounded-lg border border-polar-750 bg-polar-850 hover:bg-polar-800 text-slate-300 text-[11px] transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: DEMO IDLE (Pill Banner visible at top of page) */}
      {!isDemoActive && !isCompleted && (
        <div className="w-full border-b border-polar-750 bg-polar-950/80 px-3 sm:px-6 py-1.5 text-xs backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-slate-400 text-[10px] font-mono shrink-0">SIH 2026:</span>
              <span className="text-slate-200 text-xs font-medium truncate hidden sm:inline">
                Cascading Subsystem Incident Simulation
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openLaunchModal}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold transition-all"
              >
                <Play className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Launch SIH Demo (60s)</span>
                <span className="sm:hidden font-mono text-[10px]">Launch Demo (60s)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
