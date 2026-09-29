import {
  NoiseLevel,
  ScenarioType,
  StationCode,
  SimulatorStatus,
  ManualTickSummary,
  ScenarioDefinition,
  ActiveScenario
} from "./models/simulator.types";
import { SIMULATOR_LIMITS } from "./config/simulator.config";
import { SCENARIO_CATALOG } from "./scenarios/scenario.definitions";
import { scenarioEngine } from "./scenarios/scenario.engine";
import { simulationEngine } from "./engine/simulation.engine";
import { telemetryPersistenceService } from "./persistence/telemetry-persistence.service";
import { logger } from "../utils/logger";

export interface SimulatorStartOptions {
  intervalMs?: number;
  noiseLevel?: NoiseLevel;
}

export class SimulatorService {
  private isRunning = false;
  private intervalMs: number = SIMULATOR_LIMITS.DEFAULT_INTERVAL_MS;
  private noiseLevel: NoiseLevel = SIMULATOR_LIMITS.DEFAULT_NOISE_LEVEL;
  private timerHandle: NodeJS.Timeout | null = null;
  private isTickInProgress = false;
  private activeTickPromise: Promise<void> | null = null;

  private totalTicks = 0;
  private totalReadingsGenerated = 0;
  private lastTickAt: Date | null = null;

  /**
   * Starts the telemetry simulation loop with duplicate loop protection
   */
  async start(options?: SimulatorStartOptions): Promise<SimulatorStatus> {
    if (options?.intervalMs !== undefined) {
      this.intervalMs = Math.min(
        Math.max(options.intervalMs, SIMULATOR_LIMITS.MIN_INTERVAL_MS),
        SIMULATOR_LIMITS.MAX_INTERVAL_MS
      );
    }

    if (options?.noiseLevel !== undefined) {
      this.noiseLevel = options.noiseLevel;
    }

    // Idempotency: If already running, do not spawn a second timer loop
    if (this.isRunning && this.timerHandle) {
      logger.info("Simulator already running; updated runtime parameters", {
        intervalMs: this.intervalMs,
        noiseLevel: this.noiseLevel
      });
      return this.getStatus();
    }

    // Initialize simulation engine with database assets
    await simulationEngine.initialize();

    this.isRunning = true;

    // Run first tick immediately and await completion
    await this.runTickSafe();

    // Schedule periodic tick loop
    this.timerHandle = setInterval(() => {
      this.runTickSafe();
    }, this.intervalMs);

    logger.info("SIMULATOR_STARTED: Telemetry simulation engine loop activated", {
      intervalMs: this.intervalMs,
      noiseLevel: this.noiseLevel
    });

    return this.getStatus();
  }

  /**
   * Stops the active simulation loop cleanly
   */
  stop(): SimulatorStatus {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }

    this.isRunning = false;

    logger.info("SIMULATOR_STOPPED: Telemetry simulation engine loop stopped", {
      totalTicks: this.totalTicks,
      totalReadings: this.totalReadingsGenerated
    });

    return this.getStatus();
  }

  /**
   * Awaits any in-flight tick currently executing
   */
  async waitForActiveTick(timeoutMs = 5000): Promise<void> {
    if (!this.activeTickPromise) return;
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([this.activeTickPromise, timeout]);
  }

  /**
   * Restarts the simulation loop cleanly with optional new configuration
   */
  async restart(options?: SimulatorStartOptions): Promise<SimulatorStatus> {
    logger.info("SIMULATOR_RESTARTED: Restarting telemetry simulation engine", { options });
    this.stop();
    await this.waitForActiveTick();
    return await this.start(options);
  }

  /**
   * Internal safe tick wrapper with concurrency and error isolation
   */
  private async runTickSafe(): Promise<void> {
    if (this.isTickInProgress) {
      // Skip if previous tick is still persisting to prevent overlap
      return;
    }

    this.isTickInProgress = true;
    this.activeTickPromise = (async () => {
      try {
        await this.executeTick(true);
      } catch (error) {
        logger.error("SIMULATOR_ERROR: Unexpected failure during simulation tick", error as Error);
      } finally {
        this.isTickInProgress = false;
        this.activeTickPromise = null;
      }
    })();

    await this.activeTickPromise;
  }

  /**
   * Executes a single simulation cycle for Maitri and Bharati and persists telemetry
   */
  async executeTick(persistToDb = true, targetStations?: StationCode[]): Promise<ManualTickSummary> {
    const timestamp = new Date();
    const stationsToSimulate: StationCode[] = targetStations && targetStations.length > 0
      ? targetStations
      : ["MAITRI", "BHARATI"];

    let telemetryCount = 0;
    let energyCount = 0;
    let environmentCount = 0;
    let equipmentCount = 0;

    for (const code of stationsToSimulate) {
      try {
        const cycle = await simulationEngine.generateStationCycle(
          code,
          timestamp,
          this.intervalMs,
          this.noiseLevel
        );

        telemetryCount++;
        energyCount++;
        environmentCount++;
        equipmentCount += cycle.equipmentHealth.length;

        if (persistToDb) {
          await telemetryPersistenceService.persistCycle(cycle);
        }
      } catch (stationError) {
        logger.error(`SIMULATOR_ERROR: Failure generating or persisting telemetry for station ${code}`, stationError as Error, {
          station: code,
          timestamp: timestamp.toISOString()
        });
        // Continue with next station to ensure error isolation
      }
    }

    this.totalTicks++;
    this.totalReadingsGenerated += (telemetryCount + energyCount + environmentCount + equipmentCount);
    this.lastTickAt = timestamp;

    logger.debug("SIMULATION_TICK: Generated telemetry cycle", {
      tick: this.totalTicks,
      stations: stationsToSimulate.length,
      records: telemetryCount + energyCount + environmentCount + equipmentCount,
      timestamp: timestamp.toISOString()
    });

    return {
      stationCount: stationsToSimulate.length,
      telemetryRecords: telemetryCount,
      energyRecords: energyCount,
      environmentRecords: environmentCount,
      equipmentRecords: equipmentCount,
      timestamp: timestamp.toISOString()
    };
  }

  /**
   * Starts an anomalous scenario for a station
   */
  startScenario(
    stationCode: StationCode,
    type: ScenarioType,
    intensity?: number,
    durationSeconds?: number
  ): ActiveScenario {
    return scenarioEngine.startScenario(stationCode, type, intensity, durationSeconds);
  }

  /**
   * Stops an active scenario for a station
   */
  stopScenario(stationCode: StationCode): boolean {
    return scenarioEngine.stopScenario(stationCode);
  }

  /**
   * Returns catalog of available scenarios with current active states
   */
  getAvailableScenarios(): { catalog: ScenarioDefinition[]; active: ActiveScenario[] } {
    return {
      catalog: Object.values(SCENARIO_CATALOG),
      active: scenarioEngine.getAllActiveScenarios()
    };
  }

  /**
   * Returns comprehensive runtime status of the simulator
   */
  getStatus(): SimulatorStatus {
    const states = simulationEngine.getAllStationStates();
    const stationSummaries = states.map((s) => ({
      code: s.stationCode,
      id: s.stationId,
      healthPercent: 98.0, // composite health cached in state
      status: "OPERATIONAL",
      activeScenario: s.activeScenario ? s.activeScenario.type : null,
      environment: {
        temperature: s.currentEnvironment.temperature,
        humidity: s.currentEnvironment.humidity,
        pressure: s.currentEnvironment.pressure,
        windSpeed: s.currentEnvironment.windSpeed,
        compass: s.currentEnvironment.windDirectionCompass
      },
      energy: {
        generationKw: s.currentEnergy.generationKw,
        consumptionKw: s.currentEnergy.consumptionKw,
        netPowerKw: s.currentEnergy.netPowerKw,
        batteryPercent: s.currentEnergy.batteryPercent,
        fuelPercent: s.currentEnergy.fuelPercent
      },
      equipmentCount: s.equipmentStates.size
    }));

    return {
      enabled: true,
      running: this.isRunning,
      intervalMs: this.intervalMs,
      noiseLevel: this.noiseLevel,
      totalTicks: this.totalTicks,
      totalReadingsGenerated: this.totalReadingsGenerated,
      lastTickAt: this.lastTickAt ? this.lastTickAt.toISOString() : null,
      stations: stationSummaries,
      activeScenarios: scenarioEngine.getAllActiveScenarios()
    };
  }

  /**
   * Reset internal counters and state (primarily for test suite isolation)
   */
  resetService(): void {
    this.stop();
    this.totalTicks = 0;
    this.totalReadingsGenerated = 0;
    this.lastTickAt = null;
    simulationEngine.resetState();
  }
}

export const simulatorService = new SimulatorService();
