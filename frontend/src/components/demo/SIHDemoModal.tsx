/**
 * POLARIS — SIH Demo Mode Launch Modal
 * Phase 16: Evaluator launch dialog with 5-act narrative walkthrough
 */

import React from "react";
import {
  Play,
  X,
  Wind,
  Zap,
  Flame,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { DEMO_ACTS } from "../../services/demoService";

const ACT_ICONS = [Activity, Wind, Zap, Flame, ShieldCheck];

export const SIHDemoModal: React.FC = () => {
  const {
    isModalOpen,
    closeLaunchModal,
    startDemo,
    isStarting,
    isDemoActive,
    currentAct,
    error
  } = useDemo();

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sih-demo-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-polar-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          onClick={closeLaunchModal}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Close demo modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-polar-950 shadow-lg shadow-amber-500/25 font-bold">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                SIH 2026 Problem Statement SIH26060
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-amber-400" /> ~60 Seconds
              </span>
            </div>
            <h2 id="sih-demo-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1">
              Antarctic Incident Simulation Demo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Live deterministic cascade: <span className="text-amber-300 font-medium">Katabatic Storm Triggers Multi-Subsystem Failure at Maitri Station</span>
            </p>
          </div>
        </div>

        {/* Evaluation Banner Info */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/40 p-3.5 mb-6 text-xs text-sky-200 flex items-start gap-3">
          <Sparkles className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
          <div>
            <p className="font-semibold text-sky-100">100% Live Architecture — Zero Frontend Mocks</p>
            <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
              This demo drives our actual backend <span className="font-mono text-sky-300">SimulatorService</span> and <span className="font-mono text-sky-300">ScenarioEngine</span>. Every alert, telemetry tick, and load change propagates through real WebSockets to all pages and Digital Twin models.
            </p>
          </div>
        </div>

        {/* 5-Act Narrative Timeline */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Deterministic 5-Act Story Arc
          </h3>
          <div className="space-y-2.5">
            {DEMO_ACTS.map((actItem, idx) => {
              const Icon = ACT_ICONS[idx] || Activity;
              const isCurrent = isDemoActive && currentAct === actItem.act;

              return (
                <div
                  key={actItem.act}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? "border-amber-400/80 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-slate-800 bg-polar-950/60"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isCurrent
                        ? "bg-amber-500 text-polar-950 animate-pulse font-bold"
                        : "bg-slate-800/80 text-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="font-mono text-amber-400">Act {actItem.act}:</span>
                        {actItem.label}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        T+{actItem.startSeconds}s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {actItem.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/50 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 order-2 sm:order-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Non-destructive • Restores normal telemetry at completion</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={closeLaunchModal}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isStarting || isDemoActive}
              onClick={() => startDemo()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-polar-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Initializing Demo...</span>
                </>
              ) : isDemoActive ? (
                <>
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>Demo In Progress...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-polar-950" />
                  <span>Launch SIH Demo (60s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
