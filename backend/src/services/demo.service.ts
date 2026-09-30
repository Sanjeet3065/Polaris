/**
 * POLARIS — SIH Demo Mode Orchestration Service
 * Phase 16: Deterministic, repeatable 60-second demo narrative
 *
 * Operational Story: "Katabatic Storm Triggers Multi-Subsystem Cascade at Maitri Station"
 *
 * The demo is a scripted sequence of 5 acts driven by the existing SimulatorService
 * and ScenarioEngine. It does NOT use any mock data — all events flow through the
 * real simulation → alert evaluation → WebSocket publish pipeline.
 */

import { simulatorService } from "../simulator/simulator.service";
import { realtimeService } from "../realtime/realtime.service";
import { logger } from "../utils/logger";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export type DemoStatus = "IDLE" | "ACTIVE" | "COMPLETED";

export interface DemoAct {
  act: number;
  label: string;
  description: string;
  startSeconds: number;
}

export interface DemoState {
  status: DemoStatus;
  startedAt: string | null;
  currentAct: number;
  actLabel: string;
  actDescription: string;
  actIcon: string;
  elapsedSeconds: number;
  progressPercent: number;
  totalDurationSeconds: number;
  narrative: string;
}

/**
 * The five acts of the demo narrative — each linked to a real simulator scenario.
 * Timings are optimised for a ~60-second full-story arc.
 */
export const DEMO_ACTS: DemoAct[] = [
  {
    act: 1,
    label: "Station Baseline",
    description: "All systems nominal. MAITRI reporting health 98%. Simulator stream active.",
    startSeconds: 0
  },
  {
    act: 2,
    label: "Katabatic Storm Onset",
    description: "Sudden katabatic gale. Wind velocity climbing to 115 km/h. Visibility collapsing.",
    startSeconds: 5
  },
  {
    act: 3,
    label: "Power Generation Crisis",
    description: "Microgrid deficit detected. Battery bank draining. CRITICAL alerts firing.",
    startSeconds: 18
  },
  {
    act: 4,
    label: "Generator Critical Failure",
    description: "Primary diesel generator overheating. Temperature 111°C. Equipment CRITICAL.",
    startSeconds: 32
  },
  {
    act: 5,
    label: "Emergency Response & Recovery",
    description: "Incident command activated. Scenarios deactivated. Station stabilising.",
    startSeconds: 48
  }
];

const DEMO_ICONS: Record<number, string> = {
  1: "✅",
  2: "🌪️",
  3: "⚡",
  4: "🔴",
  5: "🔄"
};

const TOTAL_DURATION_SECONDS = 60;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class DemoService {
  private static instance: DemoService;

  private status: DemoStatus = "IDLE";
  private startedAt: Date | null = null;
  private timers: NodeJS.Timeout[] = [];
  private completionTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): DemoService {
    if (!DemoService.instance) {
      DemoService.instance = new DemoService();
    }
    return DemoService.instance;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Starts the SIH Demo sequence. Idempotent — will not start a second
   * concurrent demo while one is already active.
   */
  public async startDemo(): Promise<DemoState> {
    if (this.status === "ACTIVE") {
      logger.warn("[DemoService] Demo already active — returning current state");
      return this.getStatus();
    }

    // Ensure simulator is running at a fast tick rate for the demo
    const simStatus = simulatorService.getStatus();
    if (!simStatus.running) {
      await simulatorService.start({ intervalMs: 3000, noiseLevel: "MEDIUM" });
      logger.info("[DemoService] Simulator started for demo");
    }

    this.status = "ACTIVE";
    this.startedAt = new Date();
    this.timers = [];

    logger.info("[DemoService] SIH Demo Mode STARTED — executing 60-second narrative");

    // ---- Act 2 (T+5s): Katabatic Storm ----------------------------------------
    this._schedule(5000, () => {
      simulatorService.startScenario("MAITRI", "HIGH_WIND", 0.85, 60);
      logger.info("[DemoService] Act 2: HIGH_WIND scenario activated on MAITRI");
    });

    // ---- Act 3 (T+18s): Power Generation Crisis --------------------------------
    this._schedule(18000, () => {
      simulatorService.startScenario("MAITRI", "POWER_SHORTAGE", 0.72, 45);
      logger.info("[DemoService] Act 3: POWER_SHORTAGE scenario activated on MAITRI");
    });

    // ---- Act 4 (T+32s): Generator Overheating ---------------------------------
    this._schedule(32000, () => {
      simulatorService.startScenario("MAITRI", "GENERATOR_OVERHEAT", 0.82, 30);
      logger.info("[DemoService] Act 4: GENERATOR_OVERHEAT scenario activated on MAITRI");
    });

    // ---- Act 5 (T+48s): Emergency Stop & Recovery ------------------------------
    this._schedule(48000, () => {
      simulatorService.stopScenario("MAITRI");
      logger.info("[DemoService] Act 5: All MAITRI scenarios stopped — recovery initiated");
    });

    // ---- Demo Complete (T+60s) -------------------------------------------------
    this.completionTimer = setTimeout(() => {
      this.status = "COMPLETED";
      this.timers = [];
      this.completionTimer = null;
      logger.info("[DemoService] SIH Demo Mode COMPLETED successfully");
    }, TOTAL_DURATION_SECONDS * 1000);

    return this.getStatus();
  }

  /**
   * Immediately stops the demo, clears all pending timers, and deactivates
   * any running scenarios.
   */
  public stopDemo(): DemoState {
    // Cancel all pending scenario timers
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    if (this.completionTimer) {
      clearTimeout(this.completionTimer);
      this.completionTimer = null;
    }

    // Deactivate running scenarios on both stations
    try {
      simulatorService.stopScenario("MAITRI");
    } catch {
      // May already be stopped — safe to ignore
    }
    try {
      simulatorService.stopScenario("BHARATI");
    } catch {
      // May already be stopped — safe to ignore
    }

    this.status = "IDLE";
    this.startedAt = null;

    logger.info("[DemoService] SIH Demo Mode STOPPED by user request");
    return this.getStatus();
  }

  /**
   * Returns the current real-time demo state including elapsed seconds and act.
   */
  public getStatus(): DemoState {
    const elapsedSeconds =
      this.startedAt && (this.status === "ACTIVE" || this.status === "COMPLETED")
        ? Math.min(
            Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
            TOTAL_DURATION_SECONDS
          )
        : 0;

    const progressPercent =
      this.status === "ACTIVE"
        ? Math.min(Math.round((elapsedSeconds / TOTAL_DURATION_SECONDS) * 100), 99)
        : this.status === "COMPLETED"
        ? 100
        : 0;

    const currentAct = this._getCurrentAct(elapsedSeconds);
    const actDef = DEMO_ACTS.find((a) => a.act === currentAct) || DEMO_ACTS[0];

    return {
      status: this.status,
      startedAt: this.startedAt ? this.startedAt.toISOString() : null,
      currentAct,
      actLabel: this.status === "IDLE" ? "Ready to Launch" : actDef.label,
      actDescription:
        this.status === "IDLE"
          ? "60-second scripted operational incident demonstration"
          : actDef.description,
      actIcon: DEMO_ICONS[currentAct] || "🎯",
      elapsedSeconds,
      progressPercent,
      totalDurationSeconds: TOTAL_DURATION_SECONDS,
      narrative:
        this.status === "IDLE"
          ? "Awaiting launch"
          : this.status === "COMPLETED"
          ? "Demo narrative complete — all systems restored"
          : `Act ${currentAct}/5: ${actDef.label}`
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _schedule(ms: number, fn: () => void): void {
    const t = setTimeout(fn, ms);
    this.timers.push(t);
  }

  private _getCurrentAct(elapsed: number): number {
    // Walk acts in reverse to find the last one whose startSeconds <= elapsed
    for (let i = DEMO_ACTS.length - 1; i >= 0; i--) {
      if (elapsed >= DEMO_ACTS[i].startSeconds) {
        return DEMO_ACTS[i].act;
      }
    }
    return 1;
  }
}

export const demoService = DemoService.getInstance();
