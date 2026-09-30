import { prisma } from "../../config/prisma";
import { StationBaseline, StationCode, NoiseLevel, StationSimulationState, GeneratedTelemetryCycle } from "../models/simulator.types";
import { STATION_BASELINES } from "../config/station-baselines";
import { NOISE_PROFILES } from "../config/simulator.config";
import { IRandomProvider, DefaultRandomProvider } from "../generators/random.provider";
import { EnvironmentGenerator } from "../generators/environment.generator";
import { EnergyGenerator } from "../generators/energy.generator";
import { EquipmentGenerator, EquipmentBaselineSpec } from "../generators/equipment.generator";
import { StationGenerator } from "../generators/station.generator";
import { scenarioEngine } from "../scenarios/scenario.engine";
import { logger } from "../../utils/logger";

export class SimulationEngine {
  private rng: IRandomProvider;
  private stationStates: Map<StationCode, StationSimulationState> = new Map();
  private equipmentSpecs: Map<StationCode, EquipmentBaselineSpec[]> = new Map();
  private stationDbIds: Map<StationCode, string> = new Map();
  private initialized = false;

  constructor(rng?: IRandomProvider) {
    this.rng = rng || new DefaultRandomProvider();
  }

  /**
   * Allows replacing the random provider (e.g. for deterministic unit testing)
   */
  setRandomProvider(rng: IRandomProvider): void {
    this.rng = rng;
  }

  /**
   * Initializes station metadata and machinery inventory from PostgreSQL
   */
  async initialize(): Promise<void> {
    try {
      const stations = await prisma.station.findMany({
        include: { equipment: true }
      });

      for (const st of stations) {
        const code = st.code.toUpperCase() as StationCode;
        if (code !== "MAITRI" && code !== "BHARATI") continue;

        this.stationDbIds.set(code, st.id);

        const specs: EquipmentBaselineSpec[] = st.equipment.map((eq) => {
          let baselineTemp = 20.0;
          let baselineVibration = 1.0;

          if (eq.category === "GENERATOR") {
            baselineTemp = 83.0;
            baselineVibration = 1.9;
          } else if (eq.category === "COMMUNICATION") {
            baselineTemp = -5.0;
            baselineVibration = 0.8;
          } else if (eq.category === "WATER_SYSTEM") {
            baselineTemp = 8.0;
            baselineVibration = 2.7;
          } else if (eq.category === "BATTERY") {
            baselineTemp = 18.0;
            baselineVibration = 0.1;
          }

          return {
            id: eq.id,
            code: eq.code,
            name: eq.name,
            category: eq.category,
            baselineTempC: baselineTemp,
            baselineVibrationRms: baselineVibration,
            baselineHealthPercent: eq.healthPercent,
            initialRuntimeHours: 8000.0 + (code === "MAITRI" ? 1400 : 0)
          };
        });

        this.equipmentSpecs.set(code, specs);
      }

      this.initialized = true;
      logger.info("SimulationEngine initialized with database station assets", {
        stations: Array.from(this.stationDbIds.keys())
      });
    } catch (error) {
      logger.warn("SimulationEngine initializing with fallback IDs (database might be initializing)", {
        error: String(error)
      });
    }
  }

  /**
   * Ensures engine is initialized before generating cycles
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || this.stationDbIds.size < 2) {
      await this.initialize();
    }
  }

  /**
   * Generates a single simulation cycle for one station
   */
  async generateStationCycle(
    stationCode: StationCode,
    timestamp: Date,
    intervalMs: number,
    noiseLevel: NoiseLevel
  ): Promise<GeneratedTelemetryCycle> {
    await this.ensureInitialized();

    const baseline = STATION_BASELINES[stationCode];
    const stationId = this.stationDbIds.get(stationCode) || `fallback-${stationCode.toLowerCase()}`;
    const noise = NOISE_PROFILES[noiseLevel];

    // Advance scenario progression for this station
    const deltaSeconds = intervalMs / 1000.0;
    scenarioEngine.tick(stationCode, deltaSeconds);
    const modifiers = scenarioEngine.getModifiers(stationCode);

    // Retrieve or initialize in-memory state
    let state = this.stationStates.get(stationCode);

    // 1. Environment Telemetry
    const nextEnv = EnvironmentGenerator.generateNext(
      state ? state.currentEnvironment : null,
      baseline,
      noise,
      modifiers,
      this.rng,
      timestamp
    );

    // 2. Energy Telemetry
    const nextEnergy = EnergyGenerator.generateNext(
      state ? state.currentEnergy : null,
      baseline,
      noise,
      modifiers,
      this.rng,
      intervalMs
    );

    // 3. Equipment Telemetry
    const specs = this.equipmentSpecs.get(stationCode) || [];
    const equipmentStatesMap = state ? state.equipmentStates : new Map();
    const updatedEquipmentStates = [];
    const equipmentHealthPayloads = [];

    for (const spec of specs) {
      const prevEq = equipmentStatesMap.get(spec.id) || null;
      const nextEq = EquipmentGenerator.generateNext(
        prevEq,
        spec,
        noise,
        modifiers,
        this.rng,
        intervalMs
      );

      equipmentStatesMap.set(spec.id, nextEq);
      updatedEquipmentStates.push(nextEq);

      equipmentHealthPayloads.push({
        equipmentId: spec.id,
        equipmentCode: spec.code,
        recordedAt: timestamp,
        healthPercent: nextEq.healthPercent,
        temperature: nextEq.temperature,
        vibration: nextEq.vibration,
        runtimeHours: nextEq.runtimeHours,
        status: nextEq.status,
        notes: nextEq.notes
      });
    }

    // 4. Station Composite Health
    const evaluation = StationGenerator.evaluateStation(
      updatedEquipmentStates,
      nextEnergy,
      nextEnv
    );

    // Update state cache
    const newState: StationSimulationState = {
      stationId,
      stationCode,
      lastTickAt: timestamp,
      currentEnvironment: nextEnv,
      currentEnergy: nextEnergy,
      equipmentStates: equipmentStatesMap,
      activeScenario: scenarioEngine.getActiveScenario(stationCode),
      recoveryProgress: 1.0
    };
    this.stationStates.set(stationCode, newState);

    return {
      stationId,
      stationCode,
      timestamp,
      stationTelemetry: {
        stationId,
        recordedAt: timestamp,
        temperature: nextEnv.temperature,
        humidity: nextEnv.humidity,
        pressure: nextEnv.pressure,
        windSpeed: nextEnv.windSpeed,
        windDirection: nextEnv.windDirection,
        visibility: nextEnv.visibility
      },
      environmentalReading: {
        stationId,
        recordedAt: timestamp,
        temperature: nextEnv.temperature,
        humidity: nextEnv.humidity,
        pressure: nextEnv.pressure,
        windSpeed: nextEnv.windSpeed,
        windDirection: nextEnv.windDirection,
        windDirectionCompass: nextEnv.windDirectionCompass,
        visibility: nextEnv.visibility,
        solarRadiation: nextEnv.solarRadiation,
        snowfallRate: nextEnv.snowfallRate,
        status: nextEnv.status
      },
      energyReading: {
        stationId,
        recordedAt: timestamp,
        generationKw: nextEnergy.generationKw,
        solarKw: nextEnergy.solarKw,
        dieselKw: nextEnergy.dieselKw,
        consumptionKw: nextEnergy.consumptionKw,
        netPowerKw: nextEnergy.netPowerKw,
        batteryPercent: nextEnergy.batteryPercent,
        batteryVoltage: nextEnergy.batteryVoltage,
        fuelPercent: nextEnergy.fuelPercent,
        fuelLiters: nextEnergy.fuelLiters,
        fuelDaysRemaining: nextEnergy.fuelDaysRemaining
      },
      equipmentHealth: equipmentHealthPayloads,
      stationHealthPercent: evaluation.healthPercent,
      stationStatus: evaluation.status
    };
  }

  /**
   * Generates telemetry cycles for both Maitri and Bharati
   */
  async runAllStationsTick(
    timestamp: Date,
    intervalMs: number,
    noiseLevel: NoiseLevel
  ): Promise<GeneratedTelemetryCycle[]> {
    const stations: StationCode[] = ["MAITRI", "BHARATI"];
    const cycles: GeneratedTelemetryCycle[] = [];

    for (const code of stations) {
      const cycle = await this.generateStationCycle(code, timestamp, intervalMs, noiseLevel);
      cycles.push(cycle);
    }

    return cycles;
  }

  /**
   * Retrieves current in-memory simulation state for a station
   */
  getStationState(stationCode: StationCode): StationSimulationState | undefined {
    return this.stationStates.get(stationCode);
  }

  /**
   * Retrieves all station states
   */
  getAllStationStates(): StationSimulationState[] {
    return Array.from(this.stationStates.values());
  }

  /**
   * Resets simulation engine state (used during test teardowns)
   */
  resetState(): void {
    this.stationStates.clear();
  }
}

export const simulationEngine = new SimulationEngine();
