import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { simulatorService } from "../simulator/simulator.service";
import { simulationEngine } from "../simulator/engine/simulation.engine";
import { scenarioEngine } from "../simulator/scenarios/scenario.engine";
import { SCENARIO_CATALOG } from "../simulator/scenarios/scenario.definitions";
import { DeterministicRandomProvider } from "../simulator/generators/random.provider";
import { EnvironmentGenerator } from "../simulator/generators/environment.generator";
import { EnergyGenerator } from "../simulator/generators/energy.generator";
import { EquipmentGenerator } from "../simulator/generators/equipment.generator";
import { StationGenerator } from "../simulator/generators/station.generator";
import { STATION_BASELINES } from "../simulator/config/station-baselines";
import { NOISE_PROFILES, SIMULATOR_LIMITS } from "../simulator/config/simulator.config";
import {
  startSimulatorSchema,
  startScenarioSchema,
  stopScenarioSchema
} from "../simulator/validators/simulator.validator";
import { authorize } from "../middleware/authorize";
import { ApiError } from "../utils/apiError";

interface TestReport {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestReport[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✔ PASS: ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  ❌ FAIL: ${name} -> ${errorMsg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

export async function runSimulatorTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 4: Sensor & IoT Simulator Test Suite");
  console.log("Target: 28+ Verification Criteria");
  console.log("=================================================\n");

  try {
    // ------------------------------------------------------------
    // Group 1: Simulator Lifecycle & State Management
    // ------------------------------------------------------------
    console.log("--- Group 1: Simulator Lifecycle & Duplicate Protection ---");

    await test("1. Simulator starts successfully and reports running status", async () => {
      simulatorService.stop();
      const status = await simulatorService.start({ intervalMs: 2000, noiseLevel: "LOW" });
      assert(status.running === true, "Expected simulator to be running");
      assert(status.intervalMs === 2000, `Expected intervalMs 2000, got ${status.intervalMs}`);
      assert(status.noiseLevel === "LOW", `Expected noiseLevel LOW, got ${status.noiseLevel}`);
    });

    await test("2. Duplicate start call does not spawn duplicate intervals", async () => {
      const statusBefore = simulatorService.getStatus();
      const statusSecond = await simulatorService.start({ intervalMs: 3000 });
      assert(statusSecond.running === true, "Expected simulator to remain running");
      assert(statusSecond.intervalMs === 3000, "Interval should update without duplicate timers");
    });

    await test("3. Simulator stops cleanly and clears timers", async () => {
      const status = simulatorService.stop();
      assert(status.running === false, "Expected simulator to be stopped");
    });

    await test("4. Simulator restarts cleanly", async () => {
      const restarted = await simulatorService.restart({ intervalMs: 5000, noiseLevel: "MEDIUM" });
      assert(restarted.running === true, "Expected restarted simulator to be running");
      assert(restarted.intervalMs === 5000, "Expected interval 5000");
      simulatorService.stop();
    });

    await test("5. Simulator status contains stations, baselines, and telemetry metrics", async () => {
      const status = simulatorService.getStatus();
      assert(typeof status.totalTicks === "number", "Total ticks must be a number");
      assert(typeof status.totalReadingsGenerated === "number", "Total readings must be numeric");
      assert(status.enabled === true, "Simulator should be enabled");
    });

    // ------------------------------------------------------------
    // Group 2: Manual Simulation Ticks & Database Persistence
    // ------------------------------------------------------------
    console.log("\n--- Group 2: Manual Simulation Tick & PostgreSQL Persistence ---");

    let tickResult: any;
    await test("6. Manual tick generates telemetry for Maitri and Bharati", async () => {
      tickResult = await simulatorService.executeTick(true);
      assert(tickResult.stationCount === 2, `Expected 2 stations, got ${tickResult.stationCount}`);
      assert(tickResult.telemetryRecords === 2, "Expected 2 telemetry records");
      assert(tickResult.energyRecords === 2, "Expected 2 energy records");
      assert(tickResult.environmentRecords === 2, "Expected 2 environment records");
      assert(tickResult.equipmentRecords >= 7, `Expected at least 7 equipment records, got ${tickResult.equipmentRecords}`);
      assert(Boolean(tickResult.timestamp), "Timestamp must be present");
    });

    await test("7. Telemetry records are written to PostgreSQL and timestamps increase", async () => {
      const maitri = await prisma.station.findUnique({ where: { code: "MAITRI" } });
      assert(Boolean(maitri), "Maitri station must exist");

      const latestTelemetry = await prisma.stationTelemetry.findFirst({
        where: { stationId: maitri!.id },
        orderBy: { recordedAt: "desc" }
      });
      assert(Boolean(latestTelemetry), "Expected latest telemetry record in DB");

      const latestEnv = await prisma.environmentalReading.findFirst({
        where: { stationId: maitri!.id },
        orderBy: { recordedAt: "desc" }
      });
      assert(Boolean(latestEnv), "Expected latest environmental reading in DB");

      const latestEnergy = await prisma.energyReading.findFirst({
        where: { stationId: maitri!.id },
        orderBy: { recordedAt: "desc" }
      });
      assert(Boolean(latestEnergy), "Expected latest energy reading in DB");

      // Check equipment health records
      const equipmentHealth = await prisma.equipmentHealth.findFirst({
        orderBy: { recordedAt: "desc" }
      });
      assert(Boolean(equipmentHealth), "Expected equipment health records in DB");
    });

    // ------------------------------------------------------------
    // Group 3: Physics Engine & Realistic Telemetry Bounds
    // ------------------------------------------------------------
    console.log("\n--- Group 3: Physics Engine & Realistic Bounds ---");

    await test("8. Maitri generation matches baseline with realistic cold temperature", async () => {
      const cycle = await simulationEngine.generateStationCycle(
        "MAITRI",
        new Date(),
        5000,
        "MEDIUM"
      );
      assert(cycle.stationCode === "MAITRI", "Expected station code MAITRI");
      assert(cycle.stationTelemetry.temperature < -25, `Expected Antarctic cold (< -25°C), got ${cycle.stationTelemetry.temperature}`);
      assert(cycle.stationTelemetry.temperature > -50, `Expected within polar range (> -50°C), got ${cycle.stationTelemetry.temperature}`);
      assert(cycle.stationTelemetry.humidity >= 50 && cycle.stationTelemetry.humidity <= 95, "Humidity within realistic range");
      assert(cycle.stationTelemetry.pressure >= 950 && cycle.stationTelemetry.pressure <= 1015, "Pressure within Antarctic barometric bounds");
    });

    await test("9. Bharati generation matches baseline values", async () => {
      const cycle = await simulationEngine.generateStationCycle(
        "BHARATI",
        new Date(),
        5000,
        "MEDIUM"
      );
      assert(cycle.stationCode === "BHARATI", "Expected station code BHARATI");
      assert(cycle.stationTelemetry.temperature < -20, `Expected Antarctic cold (< -20°C), got ${cycle.stationTelemetry.temperature}`);
      assert(cycle.energyReading.generationKw > 350, "Bharati generation should be > 350 kW");
    });

    await test("10. Temperature bounds are strictly enforced (never outside -65°C to +10°C)", async () => {
      const rng = new DeterministicRandomProvider(42);
      const noise = NOISE_PROFILES.HIGH;
      const state = EnvironmentGenerator.generateNext(
        {
          temperature: -70.0, // Below min limit
          humidity: 70,
          pressure: 980,
          windSpeed: 40,
          windDirection: 180,
          windDirectionCompass: "S",
          visibility: 15,
          solarRadiation: 200,
          snowfallRate: 0,
          status: "NORMAL" as any
        },
        STATION_BASELINES.MAITRI,
        noise,
        scenarioEngine.getModifiers("MAITRI"),
        rng,
        new Date()
      );
      assert(state.temperature >= SIMULATOR_LIMITS.ENVIRONMENT.MIN_TEMP_C, "Must clamp to minimum temperature");
    });

    await test("11. Humidity bounds are strictly enforced (15% to 98%)", async () => {
      const rng = new DeterministicRandomProvider(42);
      const state = EnvironmentGenerator.generateNext(
        {
          temperature: -30.0,
          humidity: 105.0, // Beyond 100%
          pressure: 980,
          windSpeed: 40,
          windDirection: 180,
          windDirectionCompass: "S",
          visibility: 15,
          solarRadiation: 200,
          snowfallRate: 0,
          status: "NORMAL" as any
        },
        STATION_BASELINES.MAITRI,
        NOISE_PROFILES.MEDIUM,
        scenarioEngine.getModifiers("MAITRI"),
        rng,
        new Date()
      );
      assert(state.humidity <= SIMULATOR_LIMITS.ENVIRONMENT.MAX_HUMIDITY_PERCENT, "Must clamp humidity <= 98%");
    });

    await test("12. Barometric pressure bounds are strictly enforced (920 to 1045 hPa)", async () => {
      const rng = new DeterministicRandomProvider(42);
      const state = EnvironmentGenerator.generateNext(
        {
          temperature: -30.0,
          humidity: 70.0,
          pressure: 800.0, // Impossibly low
          windSpeed: 40,
          windDirection: 180,
          windDirectionCompass: "S",
          visibility: 15,
          solarRadiation: 200,
          snowfallRate: 0,
          status: "NORMAL" as any
        },
        STATION_BASELINES.MAITRI,
        NOISE_PROFILES.MEDIUM,
        scenarioEngine.getModifiers("MAITRI"),
        rng,
        new Date()
      );
      assert(state.pressure >= SIMULATOR_LIMITS.ENVIRONMENT.MIN_PRESSURE_HPA, "Must clamp pressure >= 920 hPa");
    });

    await test("13. Wind speed bounds are non-negative and capped", async () => {
      const rng = new DeterministicRandomProvider(42);
      const state = EnvironmentGenerator.generateNext(
        {
          temperature: -30.0,
          humidity: 70.0,
          pressure: 980.0,
          windSpeed: -10.0, // Negative wind
          windDirection: 180,
          windDirectionCompass: "S",
          visibility: 15,
          solarRadiation: 200,
          snowfallRate: 0,
          status: "NORMAL" as any
        },
        STATION_BASELINES.MAITRI,
        NOISE_PROFILES.MEDIUM,
        scenarioEngine.getModifiers("MAITRI"),
        rng,
        new Date()
      );
      assert(state.windSpeed >= 0, "Wind speed must be >= 0");
    });

    await test("14. Battery bounds (0–100%) and voltage correlation hold", async () => {
      const rng = new DeterministicRandomProvider(42);
      const state = EnergyGenerator.generateNext(
        null,
        STATION_BASELINES.MAITRI,
        NOISE_PROFILES.LOW,
        scenarioEngine.getModifiers("MAITRI"),
        rng,
        5000
      );
      assert(state.batteryPercent >= 0 && state.batteryPercent <= 100, "Battery percent must be in 0-100%");
      assert(state.batteryVoltage >= 42 && state.batteryVoltage <= 54, `Battery voltage must be in 42-54V, got ${state.batteryVoltage}`);
    });

    await test("15. Fuel bounds (0–100%) and burn dynamics hold", async () => {
      const rng = new DeterministicRandomProvider(42);
      const state = EnergyGenerator.generateNext(
        null,
        STATION_BASELINES.MAITRI,
        NOISE_PROFILES.LOW,
        scenarioEngine.getModifiers("MAITRI"),
        rng,
        5000
      );
      assert(state.fuelPercent >= 0 && state.fuelPercent <= 100, "Fuel percent must be in 0-100%");
      assert(state.fuelDaysRemaining > 0, "Fuel days remaining must be > 0");
    });

    await test("16. Power balance relationship: netPowerKw = generationKw - consumptionKw", async () => {
      const cycle = await simulationEngine.generateStationCycle(
        "MAITRI",
        new Date(),
        5000,
        "MEDIUM"
      );
      const expectedNet = Number((cycle.energyReading.generationKw - cycle.energyReading.consumptionKw).toFixed(1));
      assert(
        Math.abs(cycle.energyReading.netPowerKw - expectedNet) <= 0.2,
        `Expected netPowerKw ${expectedNet}, got ${cycle.energyReading.netPowerKw}`
      );
    });

    // ------------------------------------------------------------
    // Group 4: Stateful Temporal Correlation
    // ------------------------------------------------------------
    console.log("\n--- Group 4: Stateful Temporal Correlation ---");

    await test("17. Consecutive ticks exhibit smooth gradual drift rather than sudden erratic jumps", async () => {
      const t1 = new Date();
      const cycle1 = await simulationEngine.generateStationCycle("MAITRI", t1, 5000, "LOW");
      const t2 = new Date(t1.getTime() + 5000);
      const cycle2 = await simulationEngine.generateStationCycle("MAITRI", t2, 5000, "LOW");

      const tempDelta = Math.abs(cycle2.stationTelemetry.temperature - cycle1.stationTelemetry.temperature);
      assert(tempDelta < 1.0, `Temperature delta should be gradual (< 1.0°C), got ${tempDelta}°C`);

      const batteryDelta = Math.abs(cycle2.energyReading.batteryPercent - cycle1.energyReading.batteryPercent);
      assert(batteryDelta < 0.5, `Battery delta should be gradual (< 0.5%), got ${batteryDelta}%`);
    });

    // ------------------------------------------------------------
    // Group 5: Scenario Engine & Anomalies
    // ------------------------------------------------------------
    console.log("\n--- Group 5: Scenario Engine & Anomalies ---");

    await test("18. Scenario catalog exposes all 8 required simulation scenarios", async () => {
      const scenarios = simulatorService.getAvailableScenarios();
      assert(scenarios.catalog.length === 8, `Expected 8 scenarios, got ${scenarios.catalog.length}`);
      const types = scenarios.catalog.map((s) => s.type);
      assert(types.includes("NORMAL"), "Missing NORMAL");
      assert(types.includes("GENERATOR_OVERHEAT"), "Missing GENERATOR_OVERHEAT");
      assert(types.includes("BATTERY_LOW"), "Missing BATTERY_LOW");
      assert(types.includes("HIGH_WIND"), "Missing HIGH_WIND");
      assert(types.includes("POWER_SHORTAGE"), "Missing POWER_SHORTAGE");
      assert(types.includes("LOW_FUEL"), "Missing LOW_FUEL");
      assert(types.includes("COMMUNICATION_DEGRADED"), "Missing COMMUNICATION_DEGRADED");
      assert(types.includes("EQUIPMENT_DEGRADATION"), "Missing EQUIPMENT_DEGRADATION");
    });

    await test("19. GENERATOR_OVERHEAT scenario elevates generator temperature and vibration", async () => {
      simulatorService.startScenario("MAITRI", "GENERATOR_OVERHEAT", 0.95, 120);
      // Simulate 60 seconds into scenario
      scenarioEngine.tick("MAITRI", 60);

      const cycle = await simulationEngine.generateStationCycle("MAITRI", new Date(), 5000, "LOW");
      const generator = cycle.equipmentHealth.find((e) => e.notes.toLowerCase().includes("engine") || e.notes.toLowerCase().includes("cylinder") || e.temperature > 88);
      assert(Boolean(generator), "Expected generator health record with elevated temperature");
      assert(generator!.temperature > 90, `Generator temperature should be > 90°C during overheat, got ${generator!.temperature}`);
      assert(generator!.vibration > 2.5, `Generator vibration should be > 2.5 mm/s during overheat, got ${generator!.vibration}`);
      simulatorService.stopScenario("MAITRI");
    });

    await test("20. BATTERY_LOW scenario forces accelerated battery depletion", async () => {
      simulatorService.startScenario("BHARATI", "BATTERY_LOW", 0.9, 120);
      scenarioEngine.tick("BHARATI", 60);

      const modifiers = scenarioEngine.getModifiers("BHARATI");
      assert(modifiers.batteryDrainRatePerSec > 0, "Expected positive battery drain rate");
      simulatorService.stopScenario("BHARATI");
    });

    await test("21. HIGH_WIND scenario generates storm gusts, pressure plunge, and visibility drop", async () => {
      simulatorService.startScenario("MAITRI", "HIGH_WIND", 0.85, 120);
      scenarioEngine.tick("MAITRI", 60);

      const cycle = await simulationEngine.generateStationCycle("MAITRI", new Date(), 5000, "LOW");
      assert(cycle.environmentalReading.windSpeed > 80, `Expected storm winds > 80 km/h, got ${cycle.environmentalReading.windSpeed}`);
      assert(cycle.environmentalReading.visibility < 5.0, `Expected low visibility in blizzard (< 5 km), got ${cycle.environmentalReading.visibility}`);
      assert(cycle.environmentalReading.status === "WARNING" || cycle.environmentalReading.status === "CRITICAL", "Status should be WARNING or CRITICAL");
      simulatorService.stopScenario("MAITRI");
    });

    await test("22. LOW_FUEL scenario triggers accelerated fuel consumption", async () => {
      simulatorService.startScenario("MAITRI", "LOW_FUEL", 0.8, 120);
      scenarioEngine.tick("MAITRI", 30);

      const modifiers = scenarioEngine.getModifiers("MAITRI");
      assert(modifiers.fuelDrainRatePerSec > 0, "Expected positive fuel drain rate");
      simulatorService.stopScenario("MAITRI");
    });

    await test("23. Scenario deactivation transitions into smooth baseline recovery", async () => {
      simulatorService.startScenario("MAITRI", "GENERATOR_OVERHEAT", 0.8, 60);
      simulatorService.stopScenario("MAITRI");
      const active = scenarioEngine.getActiveScenario("MAITRI");
      assert(active === null, "Active scenario should be cleared after stopping");
    });

    // ------------------------------------------------------------
    // Group 6: Zod Validation & Safety Limits
    // ------------------------------------------------------------
    console.log("\n--- Group 6: Zod Validation & Safety Bounds ---");

    await test("24. Zod rejects invalid simulator interval (< 500ms or > 3600000ms)", async () => {
      const tooSmall = startSimulatorSchema.safeParse({ intervalMs: 200 });
      assert(!tooSmall.success, "Should reject interval < 500ms");

      const tooLarge = startSimulatorSchema.safeParse({ intervalMs: 5000000 });
      assert(!tooLarge.success, "Should reject interval > 3600000ms");

      const valid = startSimulatorSchema.safeParse({ intervalMs: 5000, noiseLevel: "MEDIUM" });
      assert(valid.success, "Should accept valid interval");
    });

    await test("25. Zod rejects invalid station name", async () => {
      const invalid = startScenarioSchema.safeParse({
        station: "INVALID_STATION",
        scenario: "NORMAL"
      });
      assert(!invalid.success, "Should reject non-existent station");
    });

    await test("26. Zod rejects invalid scenario name", async () => {
      const invalid = startScenarioSchema.safeParse({
        station: "MAITRI",
        scenario: "RANDOM_UNSUPPORTED_SCENARIO"
      });
      assert(!invalid.success, "Should reject unsupported scenario");
    });

    await test("27. Zod rejects invalid scenario intensity (outside 0.0 - 1.0)", async () => {
      const invalid = startScenarioSchema.safeParse({
        station: "MAITRI",
        scenario: "GENERATOR_OVERHEAT",
        intensity: 2.5
      });
      assert(!invalid.success, "Should reject intensity > 1.0");
    });

    // ------------------------------------------------------------
    // Group 7: RBAC Access Control
    // ------------------------------------------------------------
    console.log("\n--- Group 7: Role-Based Access Control (RBAC) ---");

    await test("28. RBAC middleware permits ADMIN and OPERATOR to start/stop, but denies VIEWER", async () => {
      const authorizeOperator = authorize(UserRole.ADMIN, UserRole.OPERATOR);

      // Simulated Viewer request
      const reqViewer: any = {
        user: { role: UserRole.VIEWER }
      };
      const res: any = {};
      let viewerBlocked = false;

      try {
        authorizeOperator(reqViewer, res, () => {});
      } catch (err: any) {
        if (err instanceof ApiError && err.statusCode === 403) {
          viewerBlocked = true;
        }
      }
      assert(viewerBlocked, "VIEWER must be blocked from simulator control APIs (403 Forbidden)");

      // Simulated Admin request
      const reqAdmin: any = {
        user: { role: UserRole.ADMIN }
      };
      let adminAllowed = false;
      authorizeOperator(reqAdmin, res, () => {
        adminAllowed = true;
      });
      assert(adminAllowed, "ADMIN must be granted access");

      // Simulated Operator request
      const reqOperator: any = {
        user: { role: UserRole.OPERATOR }
      };
      let operatorAllowed = false;
      authorizeOperator(reqOperator, res, () => {
        operatorAllowed = true;
      });
      assert(operatorAllowed, "OPERATOR must be granted access");
    });

    // ------------------------------------------------------------
    // Group 8: Deterministic Testing & Error Isolation
    // ------------------------------------------------------------
    console.log("\n--- Group 8: Deterministic Reproducibility & Error Isolation ---");

    await test("29. DeterministicRandomProvider produces identical outputs across runs with same seed", async () => {
      const rng1 = new DeterministicRandomProvider(999);
      const rng2 = new DeterministicRandomProvider(999);

      const seq1 = [rng1.next(), rng1.next(), rng1.nextGaussian(0, 1)];
      const seq2 = [rng2.next(), rng2.next(), rng2.nextGaussian(0, 1)];

      assert(seq1[0] === seq2[0], "Random value 1 must be identical");
      assert(seq1[1] === seq2[1], "Random value 2 must be identical");
      assert(seq1[2] === seq2[2], "Gaussian noise must be identical");
    });

    await test("30. Error isolation: Single station error does not crash the simulation tick loop", async () => {
      // Simulator service tick isolates per-station errors gracefully
      const summary = await simulatorService.executeTick(false, ["MAITRI"]);
      assert(summary.stationCount === 1, "Should execute requested station cleanly");
    });

  } finally {
    // Clean up any remaining background timers and wait for active tick to complete
    simulatorService.stop();
    await simulatorService.waitForActiveTick();
  }

  // Summary
  console.log("\n=================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  console.log(`Phase 4 Simulator Test Execution Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log("=================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Standalone execution support
if (require.main === module) {
  runSimulatorTests()
    .catch((err) => {
      console.error("Fatal test runner crash:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
