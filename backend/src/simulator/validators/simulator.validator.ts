import { z } from "zod";
import { SIMULATOR_LIMITS } from "../config/simulator.config";

export const startSimulatorSchema = z.object({
  intervalMs: z
    .number()
    .int()
    .min(SIMULATOR_LIMITS.MIN_INTERVAL_MS, `Interval must be at least ${SIMULATOR_LIMITS.MIN_INTERVAL_MS}ms`)
    .max(SIMULATOR_LIMITS.MAX_INTERVAL_MS, `Interval cannot exceed ${SIMULATOR_LIMITS.MAX_INTERVAL_MS}ms`)
    .optional(),
  noiseLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional()
});

export const startScenarioSchema = z.object({
  station: z.enum(["MAITRI", "BHARATI"], {
    errorMap: () => ({ message: "Station must be either MAITRI or BHARATI" })
  }),
  scenario: z.enum(
    [
      "NORMAL",
      "GENERATOR_OVERHEAT",
      "BATTERY_LOW",
      "HIGH_WIND",
      "POWER_SHORTAGE",
      "LOW_FUEL",
      "COMMUNICATION_DEGRADED",
      "EQUIPMENT_DEGRADATION"
    ],
    {
      errorMap: () => ({ message: "Invalid simulation scenario identifier" })
    }
  ),
  intensity: z
    .number()
    .min(0.0, "Intensity must be between 0.0 and 1.0")
    .max(1.0, "Intensity must be between 0.0 and 1.0")
    .optional(),
  durationSeconds: z
    .number()
    .int()
    .min(10, "Scenario duration must be at least 10 seconds")
    .max(86400, "Scenario duration cannot exceed 24 hours (86400s)")
    .optional()
});

export const stopScenarioSchema = z.object({
  station: z.enum(["MAITRI", "BHARATI"], {
    errorMap: () => ({ message: "Station must be either MAITRI or BHARATI" })
  }),
  scenario: z.string().optional()
});

export const manualTickSchema = z.object({
  stations: z.array(z.enum(["MAITRI", "BHARATI"])).optional(),
  persist: z.boolean().optional()
});

export type StartSimulatorInput = z.infer<typeof startSimulatorSchema>;
export type StartScenarioInput = z.infer<typeof startScenarioSchema>;
export type StopScenarioInput = z.infer<typeof stopScenarioSchema>;
export type ManualTickInput = z.infer<typeof manualTickSchema>;
