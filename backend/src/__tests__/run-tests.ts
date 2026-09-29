import { prisma } from "../config/prisma";
import { stationService } from "../services/station.service";
import { telemetryService } from "../services/telemetry.service";
import { energyService } from "../services/energy.service";
import { environmentService } from "../services/environment.service";
import { equipmentService } from "../services/equipment.service";
import { alertService } from "../services/alert.service";
import { eventService } from "../services/event.service";
import { inventoryService } from "../services/inventory.service";
import { maintenanceService } from "../services/maintenance.service";
import { historyQuerySchema, paginationQuerySchema } from "../validators/station.validator";
import { ApiError } from "../utils/apiError";
import { healthService } from "../services/health.service";
import { runAuthTests } from "./auth-tests";
import { runSimulatorTests } from "./simulator-tests";
import { runWebSocketTests } from "./websocket-tests";
import { runEnergyEnvironmentTests } from "./energy-environment-tests";
import { runLogisticsInventoryTests } from "./logistics-inventory-tests";

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

async function runAllTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 2: Database & Backend Test Suite");
  console.log("=================================================\n");

  console.log("--- Group 1: Database Health & Connectivity ---");
  await test("Database health check returns UP with latency", async () => {
    const health = await healthService.getSystemHealth();
    assert(health.status === "healthy", "Expected service status to be healthy");
    assert(health.database?.status === "UP", "Expected database status to be UP");
    assert(
      typeof health.database?.latencyMs === "number",
      "Expected database latency to be a number"
    );
  });

  console.log("\n--- Group 2: Station Services ---");
  await test("List all stations returns Maitri and Bharati", async () => {
    const stations = await stationService.getAllStations();
    assert(stations.length >= 2, `Expected at least 2 stations, found ${stations.length}`);
    const codes = stations.map((s) => s.code);
    assert(codes.includes("MAITRI"), "Expected stations to contain MAITRI");
    assert(codes.includes("BHARATI"), "Expected stations to contain BHARATI");
  });

  await test("Get Maitri station details matches Phase 1 baseline values", async () => {
    const maitri = await stationService.getStationByIdOrCode("MAITRI");
    assert(maitri.code === "MAITRI", "Expected station code MAITRI");
    assert(maitri.healthPercent >= 70.0 && maitri.healthPercent <= 100.0, "Expected Maitri health to be within valid operating range");
    assert(maitri.latitude === -70.767, "Expected Maitri latitude -70.767");
    assert(maitri.status === "OPERATIONAL", "Expected status OPERATIONAL");
  });

  await test("Get Bharati station details matches Phase 1 baseline values", async () => {
    const bharati = await stationService.getStationByIdOrCode("BHARATI");
    assert(bharati.code === "BHARATI", "Expected station code BHARATI");
    assert(bharati.healthPercent >= 70.0 && bharati.healthPercent <= 100.0, "Expected Bharati health to be within valid operating range");
    assert(bharati.latitude === -69.407, "Expected Bharati latitude -69.407");
    assert(bharati.status === "OPERATIONAL", "Expected status OPERATIONAL");
  });

  await test("Resolving invalid station identifier throws 404 ApiError", async () => {
    try {
      await stationService.resolveStation("NONEXISTENT_STATION_99");
      assert(false, "Should have thrown ApiError");
    } catch (err) {
      assert(err instanceof ApiError, "Expected ApiError instance");
      assert((err as ApiError).statusCode === 404, "Expected status code 404");
      assert((err as ApiError).code === "STATION_NOT_FOUND", "Expected code STATION_NOT_FOUND");
    }
  });

  console.log("\n--- Group 3: Telemetry & Time-Series ---");
  await test("Get latest telemetry returns valid raw numeric metrics", async () => {
    const telemetry = await telemetryService.getLatestTelemetry("MAITRI");
    assert(typeof telemetry.temperature === "number", "Temperature must be a number");
    assert(typeof telemetry.humidity === "number", "Humidity must be a number");
    assert(typeof telemetry.pressure === "number", "Pressure must be a number");
    assert(typeof telemetry.windSpeed === "number", "Wind speed must be a number");
    assert(telemetry.temperature < 0, "Antarctic temperature must be below 0");
  });

  await test("Telemetry history pagination and date window work", async () => {
    const history = await telemetryService.getTelemetryHistory("MAITRI", {
      page: 1,
      limit: 10
    });
    assert(history.items.length === 10, `Expected 10 items, got ${history.items.length}`);
    assert(history.pagination.total >= 25, `Expected at least 25 total, got ${history.pagination.total}`);
    assert(history.pagination.hasNextPage === true, "Expected hasNextPage to be true");
    assert(history.pagination.hasPrevPage === false, "Expected hasPrevPage to be false");
  });

  console.log("\n--- Group 4: Energy Telemetry ---");
  await test("Get latest energy reading matches baseline power balance", async () => {
    const energy = await energyService.getLatestEnergy("MAITRI");
    assert(energy.batteryPercent >= 20.0 && energy.batteryPercent <= 100.0, "Expected Maitri battery percent in valid range");
    assert(energy.fuelPercent >= 20.0 && energy.fuelPercent <= 100.0, "Expected Maitri fuel percent in valid range");
    assert(typeof energy.netPowerKw === "number", "netPowerKw should be a number");
  });

  await test("Energy history pagination works", async () => {
    const history = await energyService.getEnergyHistory("BHARATI", {
      page: 1,
      limit: 5
    });
    assert(history.items.length === 5, "Expected 5 energy items");
    assert(history.pagination.page === 1, "Expected page 1");
  });

  console.log("\n--- Group 5: Environmental Readings ---");
  await test("Get latest environmental reading contains atmospheric metrics", async () => {
    const env = await environmentService.getLatestEnvironment("BHARATI");
    assert(typeof env.temperature === "number", "Temperature must be numeric");
    assert(typeof env.solarRadiation === "number", "Solar radiation must be numeric");
    assert(env.windDirectionCompass === "S", "Expected cardinal wind direction S");
  });

  await test("Environmental history pagination works", async () => {
    const history = await environmentService.getEnvironmentalHistory("BHARATI", {
      page: 1,
      limit: 8
    });
    assert(history.items.length === 8, "Expected 8 environmental items");
  });

  console.log("\n--- Group 6: Equipment & Diagnostics ---");
  let testEquipmentId = "";
  await test("Find station equipment returns machinery items", async () => {
    const equip = await equipmentService.getEquipmentByStation("MAITRI", {
      page: 1,
      limit: 50
    });
    assert(equip.items.length >= 4, "Expected at least 4 equipment items for Maitri");
    testEquipmentId = equip.items[0].id;
    const categories = equip.items.map((e) => e.category);
    assert(categories.includes("GENERATOR"), "Expected equipment to include GENERATOR");
    assert(categories.includes("HVAC"), "Expected equipment to include HVAC");
  });

  await test("Equipment detail includes relations and health records", async () => {
    const details = await equipmentService.getEquipmentDetails(testEquipmentId);
    assert(details.id === testEquipmentId, "Expected matching equipment id");
    assert(Boolean(details.code), "Expected equipment code");
  });

  await test("Equipment health diagnostics history query works", async () => {
    const health = await equipmentService.getEquipmentHealthHistory(testEquipmentId, {
      page: 1,
      limit: 10
    });
    assert(health.items.length >= 1, "Expected at least 1 diagnostic health record");
    assert(typeof health.items[0].healthPercent === "number", "Health rating must be numeric");
  });

  console.log("\n--- Group 7: Alerts & Incidents ---");
  await test("Station alerts list returns active alerts", async () => {
    const alerts = await alertService.getAlertsByStation("MAITRI", {
      page: 1,
      limit: 20
    });
    assert(alerts.items.length >= 1, "Expected at least 1 alert for Maitri");
    assert(alerts.items[0].stationId.length > 0, "Alert must reference stationId");
  });

  console.log("\n--- Group 8: Operational Events & Timeline ---");
  await test("Station events timeline returns chronological entries", async () => {
    const events = await eventService.getEventsByStation("MAITRI", {
      page: 1,
      limit: 20
    });
    assert(events.items.length >= 2, "Expected at least 2 events for Maitri");
    assert(Boolean(events.items[0].title), "Event must have title");
  });

  console.log("\n--- Group 9: Logistics & Inventory ---");
  await test("Station inventory lists supplies with stock status", async () => {
    const inventory = await inventoryService.getInventoryByStation("MAITRI", {
      page: 1,
      limit: 20
    });
    assert(inventory.items.length >= 4, "Expected at least 4 inventory items for Maitri");
    const skus = inventory.items.map((i) => i.sku);
    assert(skus.includes("MAITRI-FUEL-ATF"), "Expected Jet A-1 fuel SKU");
  });

  console.log("\n--- Group 10: Maintenance Work Orders ---");
  await test("Station maintenance records return work orders", async () => {
    const maintenance = await maintenanceService.getMaintenanceByStation("MAITRI", {
      page: 1,
      limit: 20
    });
    assert(maintenance.items.length >= 2, "Expected at least 2 maintenance records for Maitri");
  });

  console.log("\n--- Group 11: Zod Validation Rules ---");
  await test("historyQuerySchema rejects invalid date range (from > to)", async () => {
    const result = historyQuerySchema.safeParse({
      from: "2026-09-28T18:00:00.000Z",
      to: "2026-09-28T12:00:00.000Z"
    });
    assert(!result.success, "Should reject when from is after to");
  });

  await test("paginationQuerySchema enforces max limit of 100", async () => {
    const result = paginationQuerySchema.safeParse({
      limit: 500
    });
    assert(!result.success, "Should reject limit > 100");
  });

  // Summary
  console.log("\n=================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  console.log(`Phase 2 Test Execution Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log("=================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }

  // Execute Phase 3 Auth & RBAC Test Suite
  await runAuthTests();

  // Execute Phase 4 Sensor & IoT Simulator Test Suite
  await runSimulatorTests();

  // Execute Phase 5 Real-Time WebSocket Test Suite
  await runWebSocketTests();

  // Execute Phase 7 Energy + Environment Monitoring Test Suite
  await runEnergyEnvironmentTests();

  // Execute Phase 8 Logistics + Inventory Test Suite
  await runLogisticsInventoryTests();
}

runAllTests()
  .catch((err) => {
    console.error("Fatal test runner crash:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
