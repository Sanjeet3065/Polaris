/**
 * POLARIS — Incident Drill Service
 * Phase 16: REST client for controlling scripted evaluation drill
 */

import { apiClient } from "../lib/apiClient";
import { ApiResponseEnvelope, DemoAct, DemoState } from "../types";

export const DEMO_ACTS: DemoAct[] = [
  {
    act: 1,
    label: "Station Baseline",
    description: "All systems nominal. MAITRI reporting health 98%. Realtime telemetry active.",
    startSeconds: 0
  },
  {
    act: 2,
    label: "Katabatic Storm Onset",
    description: "Sudden katabatic gale. Wind velocity climbing past 100 km/h. High wind alert triggered.",
    startSeconds: 5
  },
  {
    act: 3,
    label: "Power Grid Cascade",
    description: "Solar arrays buffeted by gale. Microgrid load imbalances force critical power shortage.",
    startSeconds: 18
  },
  {
    act: 4,
    label: "Generator Thermal Runaway",
    description: "Backup diesel generator overloaded under extreme thermal and mechanical strain. Critical alert.",
    startSeconds: 32
  },
  {
    act: 5,
    label: "Automated Load Shed & Recovery",
    description: "AI incident protocols engage. Non-essential circuits isolated. Station reaches stable equilibrium.",
    startSeconds: 48
  }
];

export const demoService = {
  /**
   * Fetch current demo state
   */
  async getStatus(): Promise<DemoState> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<DemoState>>("/demo/status");
    return res.data;
  },

  /**
   * Launch scripted 60-second incident drill
   */
  async start(): Promise<DemoState> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<DemoState>>("/demo/start");
    return res.data;
  },

  /**
   * Terminate demo and restore standard telemetry
   */
  async stop(): Promise<DemoState> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<DemoState>>("/demo/stop");
    return res.data;
  }
};
