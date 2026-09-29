import { StationCode } from "../../simulator/models/simulator.types";

/**
 * Monotonically increasing sequence generator for real-time telemetry streaming (Section 8)
 * Enables missed update detection, duplicate message filtering, and synchronization.
 */
export class SequenceManager {
  private static instance: SequenceManager;
  private sequences = new Map<string, number>();

  private constructor() {
    // Initial starting offsets
    this.sequences.set("MAITRI", 1000);
    this.sequences.set("BHARATI", 2000);
    this.sequences.set("GLOBAL", 0);
  }

  public static getInstance(): SequenceManager {
    if (!SequenceManager.instance) {
      SequenceManager.instance = new SequenceManager();
    }
    return SequenceManager.instance;
  }

  /**
   * Returns the next monotonic sequence number for a station or channel
   */
  public nextSequence(channel: StationCode | "GLOBAL" | string): number {
    const current = this.sequences.get(channel) ?? 0;
    const next = current + 1;
    this.sequences.set(channel, next);
    return next;
  }

  public next(channel: StationCode | "GLOBAL" | string): number {
    return this.nextSequence(channel);
  }

  /**
   * Retrieves the current sequence number without incrementing
   */
  public getSequence(channel: StationCode | "GLOBAL" | string): number {
    return this.sequences.get(channel) ?? 0;
  }

  /**
   * Resets sequence counters (useful for unit tests)
   */
  public reset(channel?: StationCode | "GLOBAL" | string): void {
    if (channel) {
      const initial = channel === "MAITRI" ? 1000 : channel === "BHARATI" ? 2000 : 0;
      this.sequences.set(channel, initial);
    } else {
      this.sequences.set("MAITRI", 1000);
      this.sequences.set("BHARATI", 2000);
      this.sequences.set("GLOBAL", 0);
    }
  }
}

export const sequenceManager = SequenceManager.getInstance();
