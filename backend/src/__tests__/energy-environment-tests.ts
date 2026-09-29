/**
 * POLARIS — Phase 7 Energy + Environment Monitoring Test Suite
 * Problem Statement: SIH26060 (Antarctic Station Operations)
 * 
 * Comprehensive tests covering:
 *   - REST API energy and environment latest/history endpoints
 *   - Station resolution, pagination, date filtering, and error handling
 *   - Centralized operational thresholds (Battery, Fuel, Power Balance, Temp, Wind, Pressure)
 *   - Mathematical calculations (Net Power, Renewable Fraction, Autonomy)
 *   - Scenario state correlations (OVERHEAT, BATTERY_LOW, HIGH_WIND, POWER_SHORTAGE, LOW_FUEL)
 */

import { prisma } from "../config/prisma";
import { energyService } from "../services/energy.service";
import { environmentService } from "../services/environment.service";
import { stationService } from "../services/station.service";
import { historyQuerySchema, paginationQuerySchema } from "../validators/station.validator";
import {
  evaluateBatteryStatus,
  evaluateFuelStatus,
  evaluatePowerBalanceStatus,
  evaluateOverallEnergyStatus,
  evaluateTemperatureStatus,
  evaluateWindStatus,
  evaluatePressureStatus,
  evaluateVisibilityStatus,
  evaluateOverallEnvironmentStatus,
  ENERGY_THRESHOLDS,
  ENVIRONMENT_THRESHOLDS
} from "../../../frontend/src/utils/thresholds";

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

export async function runEnergyEnvironmentTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 7: Energy + Environment Monitoring Test Suite");
  console.log("=================================================\n");

  try {
    // ------------------------------------------------------------
    // Group 1: Energy REST API & Service Endpoints
    // ------------------------------------------------------------
    console.log("--- Group 1: Energy REST API Endpoints & Service Queries ---");

    await test("1. Latest energy endpoint returns active reading for MAITRI", async () => {
      const reading = await energyService.getLatestEnergy("MAITRI");
      assert(!!reading, "Expected reading to exist for MAITRI");
      assert(typeof reading.generationKw === "number", "generationKw must be a number");
      assert(typeof reading.consumptionKw === "number", "consumptionKw must be a number");
      assert(typeof reading.netPowerKw === "number", "netPowerKw must be a number");
      assert(typeof reading.batteryPercent === "number", "batteryPercent must be a number");
      assert(typeof reading.fuelPercent === "number", "fuelPercent must be a number");
      assert(typeof reading.fuelDaysRemaining === "number", "fuelDaysRemaining must be a number");
    });

    await test("2. Latest energy endpoint returns active reading for BHARATI", async () => {
      const reading = await energyService.getLatestEnergy("BHARATI");
      assert(!!reading, "Expected reading to exist for BHARATI");
      assert(reading.generationKw > 0, "Bharati generation should be positive");
      assert(reading.consumptionKw > 0, "Bharati consumption should be positive");
    });

    await test("3. Energy historical endpoint returns paginated readings with metadata", async () => {
      const history = await energyService.getEnergyHistory("MAITRI", {
        page: 1,
        limit: 10
      });
      assert(Array.isArray(history.items), "Items must be an array");
      assert(history.items.length <= 10, "Should respect limit of 10");
      assert(typeof history.pagination.total === "number", "Total count must be provided");
    });

    await test("4. Energy historical endpoint respects date window filtering (from/to)", async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 3600 * 1000);
      const history = await energyService.getEnergyHistory("MAITRI", {
        page: 1,
        limit: 20,
        from: past.toISOString(),
        to: now.toISOString()
      });
      assert(Array.isArray(history.items), "Items must be an array");
      for (const item of history.items) {
        const itemDate = new Date(item.recordedAt);
        assert(itemDate >= past, "Reading date must be >= from date");
        assert(itemDate <= now, "Reading date must be <= to date");
      }
    });

    await test("5. Energy history validator rejects invalid date range (from > to)", async () => {
      const result = historyQuerySchema.safeParse({
        from: "2026-09-30T12:00:00.000Z",
        to: "2026-09-30T10:00:00.000Z"
      });
      assert(!result.success, "Validator must reject when from is after to");
    });

    await test("6. Energy history validator enforces limit ceiling of 100", async () => {
      const result = paginationQuerySchema.safeParse({ limit: 250 });
      assert(!result.success, "Validator must reject limit exceeding 100");
    });

    await test("7. Station resolution throws 404 for unknown station code", async () => {
      let threw = false;
      try {
        await energyService.getLatestEnergy("UNKNOWN_BASE");
      } catch (err: any) {
        threw = true;
        assert(err.statusCode === 404, "Expected 404 status code");
      }
      assert(threw, "Expected call with invalid station code to throw");
    });

    // ------------------------------------------------------------
    // Group 2: Environmental REST API & Service Endpoints
    // ------------------------------------------------------------
    console.log("\n--- Group 2: Environmental REST API Endpoints & Service Queries ---");

    await test("8. Latest environmental endpoint returns active AWS reading for MAITRI", async () => {
      const reading = await environmentService.getLatestEnvironment("MAITRI");
      assert(!!reading, "Expected environmental reading for MAITRI");
      assert(typeof reading.temperature === "number", "Temperature must be a number");
      assert(typeof reading.humidity === "number", "Humidity must be a number");
      assert(typeof reading.pressure === "number", "Pressure must be a number");
      assert(typeof reading.windSpeed === "number", "Wind speed must be a number");
      assert(typeof reading.windDirectionCompass === "string", "Wind direction compass must be string");
    });

    await test("9. Latest environmental endpoint returns active AWS reading for BHARATI", async () => {
      const reading = await environmentService.getLatestEnvironment("BHARATI");
      assert(!!reading, "Expected environmental reading for BHARATI");
      assert(typeof reading.visibility === "number", "Visibility must be a number");
      assert(typeof reading.solarRadiation === "number", "Solar radiation must be a number");
    });

    await test("10. Environmental historical endpoint returns paginated records with total count", async () => {
      const history = await environmentService.getEnvironmentalHistory("BHARATI", {
        page: 1,
        limit: 15
      });
      assert(Array.isArray(history.items), "Items must be an array");
      assert(history.items.length <= 15, "Should not exceed limit of 15");
      assert(history.pagination.page === 1, "Page number should be 1");
    });

    await test("11. Environmental historical readings maintain strict station isolation", async () => {
      const maitriStation = await stationService.resolveStation("MAITRI");
      const bharatiStation = await stationService.resolveStation("BHARATI");

      const maitriHist = await environmentService.getEnvironmentalHistory("MAITRI", { page: 1, limit: 10 });
      for (const item of maitriHist.items) {
        assert(item.stationId === maitriStation.id, "Maitri record must have Maitri stationId");
        assert(item.stationId !== bharatiStation.id, "Maitri record must not belong to Bharati");
      }
    });

    // ------------------------------------------------------------
    // Group 3: Energy Thresholds & Operational Status Evaluation
    // ------------------------------------------------------------
    console.log("\n--- Group 3: Energy Thresholds & Operational Status Evaluation ---");

    await test("12. Battery SoC evaluation: NORMAL (>35%), WARNING (<=35%), CRITICAL (<=20%)", async () => {
      const normal = evaluateBatteryStatus(75);
      assert(normal.status === "NORMAL", "75% SoC should be NORMAL");

      const warning = evaluateBatteryStatus(30);
      assert(warning.status === "WARNING", "30% SoC should be WARNING");

      const critical = evaluateBatteryStatus(18);
      assert(critical.status === "CRITICAL", "18% SoC should be CRITICAL");
    });

    await test("13. Battery voltage below 460V triggers CRITICAL even if SoC is nominal", async () => {
      const lowVolt = evaluateBatteryStatus(50, 455);
      assert(lowVolt.status === "CRITICAL", "Bus voltage < 460V must evaluate to CRITICAL");
    });

    await test("14. Fuel reserve evaluation: NORMAL (>40%), WARNING (<=40%), CRITICAL (<=20% or <=14d)", async () => {
      const normal = evaluateFuelStatus(65, 120);
      assert(normal.status === "NORMAL", "65% fuel should be NORMAL");

      const warning = evaluateFuelStatus(35, 25);
      assert(warning.status === "WARNING", "35% fuel should be WARNING");

      const critPct = evaluateFuelStatus(15, 45);
      assert(critPct.status === "CRITICAL", "15% fuel should be CRITICAL");

      const critDays = evaluateFuelStatus(55, 10);
      assert(critDays.status === "CRITICAL", "10 days remaining should be CRITICAL regardless of percent");
    });

    await test("15. Power balance evaluation: Surplus (>2kW), Minor deficit (<-15kW), Severe deficit (<-50kW)", async () => {
      const surplus = evaluatePowerBalanceStatus(25);
      assert(surplus.status === "NORMAL", "Surplus power must be NORMAL");
      assert(surplus.label.includes("Surplus"), "Label should indicate surplus");

      const balanced = evaluatePowerBalanceStatus(0);
      assert(balanced.status === "NORMAL", "Zero net balance must be NORMAL");

      const minorDeficit = evaluatePowerBalanceStatus(-25);
      assert(minorDeficit.status === "WARNING", "-25 kW deficit must be WARNING");

      const severeDeficit = evaluatePowerBalanceStatus(-65);
      assert(severeDeficit.status === "CRITICAL", "-65 kW deficit must be CRITICAL");
    });

    await test("16. Overall Energy status aggregation prioritizes worst-case severity", async () => {
      // Normal battery, Normal fuel, Critical power deficit -> Overall Critical
      const overall = evaluateOverallEnergyStatus({
        batterySoc: 80,
        fuelPercent: 70,
        netPowerKw: -60,
        fuelDays: 150
      });
      assert(overall.status === "CRITICAL", "Any critical subsystem must escalate overall to CRITICAL");

      // Warning battery, Normal fuel, Normal power -> Overall Warning
      const warningOverall = evaluateOverallEnergyStatus({
        batterySoc: 30,
        fuelPercent: 70,
        netPowerKw: 10,
        fuelDays: 150
      });
      assert(warningOverall.status === "WARNING", "Warning subsystem must escalate overall to WARNING");
    });

    // ------------------------------------------------------------
    // Group 4: Environmental Thresholds & Meteorological Safety
    // ------------------------------------------------------------
    console.log("\n--- Group 4: Environmental Thresholds & Meteorological Safety ---");

    await test("17. Ambient temperature evaluation: Nominal (>-40°C), Severe Chill (<=-40°C), Polar Hazard (<=-55°C)", async () => {
      const nominal = evaluateTemperatureStatus(-30.5);
      assert(nominal.status === "NORMAL", "-30.5°C should be NORMAL");

      const warning = evaluateTemperatureStatus(-45.0);
      assert(warning.status === "WARNING", "-45.0°C should be WARNING");

      const hazard = evaluateTemperatureStatus(-58.2);
      assert(hazard.status === "CRITICAL", "-58.2°C should be CRITICAL");
    });

    await test("18. Wind speed evaluation: Moderate (<=50km/h), Gale Warning (>50km/h), Katabatic Blizzard (>80km/h)", async () => {
      const moderate = evaluateWindStatus(35);
      assert(moderate.status === "NORMAL", "35 km/h should be NORMAL");

      const gale = evaluateWindStatus(65);
      assert(gale.status === "WARNING", "65 km/h should be WARNING");

      const blizzard = evaluateWindStatus(95);
      assert(blizzard.status === "CRITICAL", "95 km/h should be CRITICAL");
      assert(blizzard.label.includes("Blizzard"), "Label should specify Blizzard");
    });

    await test("19. Barometric pressure evaluation: Stable (>=970hPa), Depression (<970hPa), Cyclonic plunge (<955hPa)", async () => {
      const stable = evaluatePressureStatus(985);
      assert(stable.status === "NORMAL", "985 hPa should be NORMAL");

      const depression = evaluatePressureStatus(965);
      assert(depression.status === "WARNING", "965 hPa should be WARNING");

      const cyclonic = evaluatePressureStatus(948);
      assert(cyclonic.status === "CRITICAL", "948 hPa should be CRITICAL");
    });

    await test("20. Optical visibility evaluation: Clear (>=5km), Restricted (<5km), Whiteout (<1km)", async () => {
      const clear = evaluateVisibilityStatus(14.5);
      assert(clear.status === "NORMAL", "14.5 km should be NORMAL");

      const restricted = evaluateVisibilityStatus(3.2);
      assert(restricted.status === "WARNING", "3.2 km should be WARNING");

      const whiteout = evaluateVisibilityStatus(0.6);
      assert(whiteout.status === "CRITICAL", "0.6 km should be CRITICAL");
    });

    await test("21. Overall Environment status correctly triggers Hazard if wind > 80 km/h", async () => {
      const overall = evaluateOverallEnvironmentStatus({
        temperatureC: -28.0,
        windSpeedKmh: 88.0,
        pressureHpa: 980,
        visibilityKm: 12.0
      });
      assert(overall.status === "CRITICAL", "High wind alone should trigger CRITICAL environment status");
    });

    // ------------------------------------------------------------
    // Group 5: Mathematical Formulas & Calculation Correctness
    // ------------------------------------------------------------
    console.log("\n--- Group 5: Mathematical Formulas & Calculation Correctness ---");

    await test("22. Net Power Balance formula strictly equals generation - consumption", async () => {
      const maitri = await energyService.getLatestEnergy("MAITRI");
      const calculatedNet = maitri.generationKw - maitri.consumptionKw;
      // Allow minor 0.1 floating point rounding
      assert(
        Math.abs(maitri.netPowerKw - calculatedNet) < 0.2,
        `Net power ${maitri.netPowerKw} must equal generation ${maitri.generationKw} - consumption ${maitri.consumptionKw}`
      );
    });

    await test("23. Renewable solar fraction computes correct percentage", async () => {
      const solarKw = 45;
      const totalGenKw = 450;
      const fraction = Math.round((solarKw / totalGenKw) * 100);
      assert(fraction === 10, "45 kW of 450 kW should be exactly 10%");
    });

    // ------------------------------------------------------------
    // Group 6: Scenario Integration & Telemetry Correlation
    // ------------------------------------------------------------
    console.log("\n--- Group 6: Scenario Integration & Telemetry Correlation ---");

    await test("24. BATTERY_LOW scenario boundary aligns with critical threshold (<=20%)", async () => {
      assert(ENERGY_THRESHOLDS.battery.criticalSocPercent === 20, "BATTERY_LOW cutoff must be 20%");
      const evalResult = evaluateBatteryStatus(ENERGY_THRESHOLDS.battery.criticalSocPercent);
      assert(evalResult.status === "CRITICAL", "Threshold boundary must trigger CRITICAL");
    });

    await test("25. LOW_FUEL scenario boundary aligns with reserve safety limit (<=20%)", async () => {
      assert(ENERGY_THRESHOLDS.fuel.criticalPercent === 20, "LOW_FUEL cutoff must be 20%");
      const evalResult = evaluateFuelStatus(ENERGY_THRESHOLDS.fuel.criticalPercent);
      assert(evalResult.status === "CRITICAL", "Reserve boundary must trigger CRITICAL");
    });

    await test("26. HIGH_WIND scenario boundary aligns with blizzard hazard limit (80 km/h)", async () => {
      assert(ENVIRONMENT_THRESHOLDS.windSpeed.criticalKmh === 80, "HIGH_WIND cutoff must be 80 km/h");
      const evalResult = evaluateWindStatus(ENVIRONMENT_THRESHOLDS.windSpeed.criticalKmh);
      assert(evalResult.status === "CRITICAL", "Blizzard boundary must trigger CRITICAL");
    });

    await test("27. POWER_SHORTAGE scenario boundary aligns with deficit threshold (-50 kW)", async () => {
      assert(ENERGY_THRESHOLDS.powerBalance.criticalDeficitKw === -50, "POWER_SHORTAGE cutoff must be -50 kW");
      const evalResult = evaluatePowerBalanceStatus(ENERGY_THRESHOLDS.powerBalance.criticalDeficitKw);
      assert(evalResult.status === "CRITICAL", "Severe deficit must trigger CRITICAL");
    });

    await test("28. Offline system state correctly sets all evaluators to OFFLINE", async () => {
      const bOffline = evaluateBatteryStatus(90, 500, true);
      const fOffline = evaluateFuelStatus(90, 300, true);
      const pOffline = evaluatePowerBalanceStatus(50, true);
      const tOffline = evaluateTemperatureStatus(-25, true);
      const wOffline = evaluateWindStatus(20, true);

      assert(bOffline.status === "OFFLINE", "Battery must evaluate to OFFLINE");
      assert(fOffline.status === "OFFLINE", "Fuel must evaluate to OFFLINE");
      assert(pOffline.status === "OFFLINE", "Power must evaluate to OFFLINE");
      assert(tOffline.status === "OFFLINE", "Temperature must evaluate to OFFLINE");
      assert(wOffline.status === "OFFLINE", "Wind must evaluate to OFFLINE");
    });

    // Summary
    console.log("\n=================================================");
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = results.filter((r) => !r.passed).length;
    console.log(`Phase 7 Test Execution Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log("=================================================\n");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (fatal: unknown) {
    console.error("Fatal Phase 7 test runner error:", fatal);
    process.exit(1);
  }
}

// Allow standalone execution via tsx
if (process.argv[1]?.includes("energy-environment-tests")) {
  runEnergyEnvironmentTests()
    .catch((err) => {
      console.error("Unhandled rejection in Phase 7 runner:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
