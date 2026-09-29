import {
  ActiveScenario,
  ScenarioType,
  StationCode
} from "../models/simulator.types";
import { SCENARIO_CATALOG } from "./scenario.definitions";
import { logger } from "../../utils/logger";

export interface ScenarioModifiers {
  // Environment
  tempOffsetC: number;
  humidityOffset: number;
  pressureOffsetHpa: number;
  windSpeedOffsetKmh: number;
  visibilityFactor: number; // multiplier, e.g. 0.1 for blizzard
  solarFactor: number;

  // Energy
  generationFactor: number; // multiplier on power generation
  consumptionFactor: number; // multiplier on power consumption
  batteryDrainRatePerSec: number; // additional % drop per second
  fuelDrainRatePerSec: number;

  // Equipment
  generatorTempOffsetC: number;
  generatorVibrationOffset: number;
  generatorHealthOffset: number;
  communicationHealthOffset: number;
  generalEquipmentHealthOffset: number;
  generalVibrationOffset: number;
}

export class ScenarioEngine {
  private activeScenarios: Map<StationCode, ActiveScenario> = new Map();
  // Recovery progress: stationCode -> number (0.0 right after scenario ends, approaches 1.0 when fully normal)
  private recoveryProgress: Map<StationCode, number> = new Map();

  /**
   * Starts a simulation scenario for a station
   */
  startScenario(
    stationCode: StationCode,
    type: ScenarioType,
    intensity?: number,
    durationSeconds?: number
  ): ActiveScenario {
    if (type === "NORMAL") {
      this.stopScenario(stationCode);
      return {
        id: `scen_${stationCode.toLowerCase()}_normal_${Date.now()}`,
        stationCode,
        type: "NORMAL",
        intensity: 0.5,
        durationSeconds: 0,
        startedAt: new Date(),
        elapsedSeconds: 0,
        status: "ACTIVE"
      };
    }

    const definition = SCENARIO_CATALOG[type];
    const finalIntensity = Math.min(Math.max(intensity ?? definition.defaultIntensity, 0.0), 1.0);
    const finalDuration = Math.max(durationSeconds ?? definition.defaultDurationSeconds, 10);

    const scenario: ActiveScenario = {
      id: `scen_${stationCode.toLowerCase()}_${type.toLowerCase()}_${Date.now()}`,
      stationCode,
      type,
      intensity: finalIntensity,
      durationSeconds: finalDuration,
      startedAt: new Date(),
      elapsedSeconds: 0,
      status: "ACTIVE"
    };

    this.activeScenarios.set(stationCode, scenario);
    this.recoveryProgress.set(stationCode, 0.0);

    logger.info("Simulation scenario started", {
      station: stationCode,
      scenario: type,
      intensity: finalIntensity,
      durationSeconds: finalDuration
    });

    return scenario;
  }

  /**
   * Stops an active scenario on a station
   */
  stopScenario(stationCode: StationCode): boolean {
    const active = this.activeScenarios.get(stationCode);
    if (!active || active.status !== "ACTIVE") {
      return false;
    }

    active.status = "STOPPED";
    this.activeScenarios.delete(stationCode);
    this.recoveryProgress.set(stationCode, 0.0); // Begin gradual recovery to baseline

    logger.info("Simulation scenario stopped", {
      station: stationCode,
      scenario: active.type,
      elapsedSeconds: active.elapsedSeconds
    });

    return true;
  }

  /**
   * Retrieves active scenario for a station
   */
  getActiveScenario(stationCode: StationCode): ActiveScenario | null {
    return this.activeScenarios.get(stationCode) || null;
  }

  /**
   * Retrieves all active scenarios across all stations
   */
  getAllActiveScenarios(): ActiveScenario[] {
    return Array.from(this.activeScenarios.values()).filter((s) => s.status === "ACTIVE");
  }

  /**
   * Advances simulation time for active scenarios and updates recovery progress
   */
  tick(stationCode: StationCode, deltaSeconds: number): void {
    const active = this.activeScenarios.get(stationCode);
    if (active && active.status === "ACTIVE") {
      active.elapsedSeconds += deltaSeconds;

      if (active.elapsedSeconds >= active.durationSeconds) {
        active.status = "COMPLETED";
        this.activeScenarios.delete(stationCode);
        this.recoveryProgress.set(stationCode, 0.0); // Trigger recovery

        logger.info("Simulation scenario completed", {
          station: stationCode,
          scenario: active.type,
          duration: active.durationSeconds
        });
      }
    } else {
      // Advance recovery curve towards baseline (1.0 = fully recovered)
      const currentRecovery = this.recoveryProgress.get(stationCode) ?? 1.0;
      if (currentRecovery < 1.0) {
        // Recovers smoothly over ~60 seconds
        const step = deltaSeconds / 60.0;
        this.recoveryProgress.set(stationCode, Math.min(1.0, currentRecovery + step));
      }
    }
  }

  /**
   * Computes the mathematical telemetry modifiers for the current station state
   */
  getModifiers(stationCode: StationCode): ScenarioModifiers {
    const active = this.activeScenarios.get(stationCode);
    const recovery = this.recoveryProgress.get(stationCode) ?? 1.0;

    // Default neutral modifiers
    const mods: ScenarioModifiers = {
      tempOffsetC: 0,
      humidityOffset: 0,
      pressureOffsetHpa: 0,
      windSpeedOffsetKmh: 0,
      visibilityFactor: 1.0,
      solarFactor: 1.0,
      generationFactor: 1.0,
      consumptionFactor: 1.0,
      batteryDrainRatePerSec: 0,
      fuelDrainRatePerSec: 0,
      generatorTempOffsetC: 0,
      generatorVibrationOffset: 0,
      generatorHealthOffset: 0,
      communicationHealthOffset: 0,
      generalEquipmentHealthOffset: 0,
      generalVibrationOffset: 0
    };

    if (active && active.status === "ACTIVE") {
      // Calculate growth curve for scenario: ramps up during the first 25% of duration
      const rampUpTime = Math.min(active.durationSeconds * 0.25, 45); // up to 45 seconds to full intensity
      const progressFactor = active.elapsedSeconds < rampUpTime
        ? active.elapsedSeconds / rampUpTime
        : 1.0;

      const intensity = active.intensity * progressFactor;

      switch (active.type) {
        case "GENERATOR_OVERHEAT":
          mods.generatorTempOffsetC = 28.0 * intensity;      // Up to +28°C (83°C -> 111°C)
          mods.generatorVibrationOffset = 3.5 * intensity;    // Up to +3.5 mm/s (1.9 -> 5.4 mm/s)
          mods.generatorHealthOffset = -35.0 * intensity;     // -35% health
          mods.consumptionFactor = 1.05;                      // Slightly higher load
          break;

        case "BATTERY_LOW":
          mods.batteryDrainRatePerSec = 0.12 * intensity;     // Drops ~7.2% per minute
          mods.generationFactor = 0.85;                       // Reduced generation
          break;

        case "HIGH_WIND":
          mods.windSpeedOffsetKmh = 75.0 * intensity;         // Winds reaching 115-120 km/h
          mods.visibilityFactor = Math.max(0.05, 1.0 - 0.9 * intensity); // Drops to ~0.5 km
          mods.pressureOffsetHpa = -28.0 * intensity;         // Barometric plunge
          mods.tempOffsetC = -6.0 * intensity;                // Wind chill drop
          mods.humidityOffset = 8.0 * intensity;
          break;

        case "POWER_SHORTAGE":
          mods.generationFactor = Math.max(0.3, 1.0 - 0.65 * intensity); // Generation down by up to 65%
          mods.consumptionFactor = 1.0;
          mods.batteryDrainRatePerSec = 0.08 * intensity;
          break;

        case "LOW_FUEL":
          mods.fuelDrainRatePerSec = 0.08 * intensity;        // Rapid fuel drawdown
          break;

        case "COMMUNICATION_DEGRADED":
          mods.communicationHealthOffset = -45.0 * intensity; // Antenna health drops to ~50%
          break;

        case "EQUIPMENT_DEGRADATION":
          mods.generalEquipmentHealthOffset = -22.0 * intensity;
          mods.generalVibrationOffset = 2.2 * intensity;
          mods.generatorTempOffsetC = 12.0 * intensity;
          break;

        case "NORMAL":
        default:
          break;
      }
    } else if (recovery < 1.0) {
      // During recovery, remnant offsets decay linearly from residual towards 0
      // recovery = 0 (just ended) -> 1 (fully restored)
      const decay = 1.0 - recovery;
      // Slight residue fading out
      mods.generatorTempOffsetC = 8.0 * decay;
      mods.generatorVibrationOffset = 0.8 * decay;
      mods.windSpeedOffsetKmh = 10.0 * decay;
      mods.visibilityFactor = 0.5 + 0.5 * recovery;
    }

    return mods;
  }
}

export const scenarioEngine = new ScenarioEngine();
