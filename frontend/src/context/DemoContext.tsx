/**
 * POLARIS — Automated Incident Drill Context
 * Phase 16: State management & active polling for scripted evaluation demo
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { DemoState, DemoStatus } from "../types";
import { demoService } from "../services/demoService";

interface DemoContextType {
  demoState: DemoState | null;
  status: DemoStatus;
  isDemoActive: boolean;
  isCompleted: boolean;
  currentAct: number;
  actLabel: string;
  actDescription: string;
  actIcon: string;
  elapsedSeconds: number;
  progressPercent: number;
  totalDurationSeconds: number;
  narrative: string;
  isModalOpen: boolean;
  isStarting: boolean;
  isStopping: boolean;
  error: string | null;
  openLaunchModal: () => void;
  closeLaunchModal: () => void;
  startDemo: () => Promise<void>;
  stopDemo: () => Promise<void>;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const state = await demoService.getStatus();
      setDemoState(state);
      return state;
    } catch (err: unknown) {
      // Don't flood console with 401s if unauthenticated
      return null;
    }
  }, []);

  // Poll status when demo is ACTIVE
  useEffect(() => {
    if (demoState?.status === "ACTIVE") {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          const state = await fetchStatus();
          if (state && state.status !== "ACTIVE") {
            clearPolling();
          }
        }, 1500);
      }
    } else {
      clearPolling();
    }

    return () => {
      clearPolling();
    };
  }, [demoState?.status, fetchStatus, clearPolling]);

  // Initial check on mount to restore active demo state if page refreshed
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const openLaunchModal = useCallback(() => {
    setError(null);
    setIsModalOpen(true);
  }, []);

  const closeLaunchModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const startDemo = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    try {
      const state = await demoService.start();
      setDemoState(state);
      setIsModalOpen(false); // Close launch dialog so user sees the live operational view
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || "Failed to start emergency drill";
      setError(msg);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const stopDemo = useCallback(async () => {
    setIsStopping(true);
    setError(null);
    try {
      const state = await demoService.stop();
      setDemoState(state);
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || "Failed to stop emergency drill";
      setError(msg);
      throw err;
    } finally {
      setIsStopping(false);
    }
  }, []);

  const resetDemo = useCallback(() => {
    setDemoState(null);
    setError(null);
  }, []);

  const isDemoActive = demoState?.status === "ACTIVE";
  const isCompleted = demoState?.status === "COMPLETED";

  const value: DemoContextType = {
    demoState,
    status: demoState?.status || "IDLE",
    isDemoActive,
    isCompleted,
    currentAct: demoState?.currentAct ?? 1,
    actLabel: demoState?.actLabel ?? "",
    actDescription: demoState?.actDescription ?? "",
    actIcon: demoState?.actIcon ?? "❄️",
    elapsedSeconds: demoState?.elapsedSeconds ?? 0,
    progressPercent: demoState?.progressPercent ?? 0,
    totalDurationSeconds: demoState?.totalDurationSeconds ?? 62,
    narrative: demoState?.narrative ?? "",
    isModalOpen,
    isStarting,
    isStopping,
    error,
    openLaunchModal,
    closeLaunchModal,
    startDemo,
    stopDemo,
    resetDemo
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
