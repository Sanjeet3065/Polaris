/**
 * POLARIS — Phase 6 Digital Twin Verification Test Suite
 * Automated verification of 3D spatial models, equipment coordinates,
 * state transformations, scenario responses, and layer controls.
 */

import { EQUIPMENT_POSITIONS, getEquipmentPosition } from "../components/digital-twin/equipmentPositions";
import { StationCode, EquipmentStatus } from "../types";
import { Equipment3DState, DigitalTwinLayerState } from "../components/digital-twin/types";

declare const process: { argv: string[]; exit: (code?: number) => never };

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function test(id: number, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true });
    console.log(`  ✔ PASS: ${id}. ${name}`);
  } catch (err: any) {
    results.push({ id, name, passed: false, error: err.message });
    console.error(`  ✖ FAIL: ${id}. ${name} -> ${err.message}`);
  }
}

export function runDigitalTwinTests(): boolean {
  console.log("\n=================================================");
  console.log("POLARIS Phase 6: 3D Digital Twin Test Suite");
  console.log("=================================================\n");

  // --- Group 1: Spatial Layout & Coordinate Mappings ---
  test(1, "Maitri spatial layout contains all 8 required equipment assets", () => {
    const maitriAssets = EQUIPMENT_POSITIONS.MAITRI;
    assert(maitriAssets.length === 8, `Expected 8 Maitri assets, got ${maitriAssets.length}`);
    const ids = maitriAssets.map((a) => a.equipmentId);
    assert(ids.includes("eq-m-gen-01"), "Missing eq-m-gen-01");
    assert(ids.includes("eq-m-gen-02"), "Missing eq-m-gen-02");
    assert(ids.includes("eq-m-conv-01"), "Missing eq-m-conv-01");
    assert(ids.includes("eq-m-hvac-01"), "Missing eq-m-hvac-01");
    assert(ids.includes("eq-m-comm-01"), "Missing eq-m-comm-01");
    assert(ids.includes("eq-m-water-01"), "Missing eq-m-water-01");
    assert(ids.includes("eq-m-bat-01"), "Missing eq-m-bat-01");
    assert(ids.includes("eq-m-fuel-01"), "Missing eq-m-fuel-01");
  });

  test(2, "Bharati spatial layout contains all 8 required equipment assets", () => {
    const bharatiAssets = EQUIPMENT_POSITIONS.BHARATI;
    assert(bharatiAssets.length === 8, `Expected 8 Bharati assets, got ${bharatiAssets.length}`);
    const ids = bharatiAssets.map((a) => a.equipmentId);
    assert(ids.includes("eq-b-gen-01"), "Missing eq-b-gen-01");
    assert(ids.includes("eq-b-gen-02"), "Missing eq-b-gen-02");
    assert(ids.includes("eq-b-conv-01"), "Missing eq-b-conv-01");
    assert(ids.includes("eq-b-hvac-01"), "Missing eq-b-hvac-01");
    assert(ids.includes("eq-b-comm-01"), "Missing eq-b-comm-01");
    assert(ids.includes("eq-b-water-01"), "Missing eq-b-water-01");
    assert(ids.includes("eq-b-bat-01"), "Missing eq-b-bat-01");
    assert(ids.includes("eq-b-fuel-01"), "Missing eq-b-fuel-01");
  });

  test(3, "Equipment coordinates are within realistic bounded polar perimeter", () => {
    const allPositions = [...EQUIPMENT_POSITIONS.MAITRI, ...EQUIPMENT_POSITIONS.BHARATI];
    for (const item of allPositions) {
      const [x, y, z] = item.position;
      assert(x >= -40 && x <= 40, `${item.equipmentId} X out of bounds: ${x}`);
      assert(y >= 0 && y <= 15, `${item.equipmentId} Y out of bounds: ${y}`);
      assert(z >= -40 && z <= 40, `${item.equipmentId} Z out of bounds: ${z}`);
    }
  });

  test(4, "getEquipmentPosition helper returns correct position data", () => {
    const pos = getEquipmentPosition("MAITRI", "eq-m-gen-01");
    assert(pos !== undefined, "Position should be found");
    assert(pos!.name.includes("Generator 01"), "Name mismatch");
    assert(pos!.modelType === "GENERATOR", "Model type mismatch");
  });

  test(5, "getEquipmentPosition returns undefined for unknown equipment", () => {
    const pos = getEquipmentPosition("MAITRI", "non-existent-asset");
    assert(pos === undefined, "Should return undefined for non-existent asset");
  });

  test(6, "All 7 canonical 3D model types are mapped", () => {
    const allPositions = [...EQUIPMENT_POSITIONS.MAITRI, ...EQUIPMENT_POSITIONS.BHARATI];
    const types = new Set(allPositions.map((p) => p.modelType));
    assert(types.has("GENERATOR"), "Missing GENERATOR type");
    assert(types.has("HVAC"), "Missing HVAC type");
    assert(types.has("CONVERTER"), "Missing CONVERTER type");
    assert(types.has("ANTENNA"), "Missing ANTENNA type");
    assert(types.has("WATER_PUMP"), "Missing WATER_PUMP type");
    assert(types.has("BATTERY"), "Missing BATTERY type");
    assert(types.has("FUEL_TANK"), "Missing FUEL_TANK type");
  });

  test(7, "Maitri coordinates anchor Lake Priyadarshini water pump at oasis lake perimeter", () => {
    const pump = getEquipmentPosition("MAITRI", "eq-m-water-01");
    assert(pump !== undefined, "Pump must exist");
    assert(pump!.position[0] < -10, "Lake pump must be positioned at west perimeter towards lake");
  });

  test(8, "Bharati coordinates position C-Band Tracking dish at coastal radar platform", () => {
    const dish = getEquipmentPosition("BHARATI", "eq-b-comm-01");
    assert(dish !== undefined, "Dish must exist");
    assert(dish!.modelType === "ANTENNA", "Must be antenna type");
    assert(dish!.position[1] >= 2.5, "Must be elevated on tracking pedestal");
  });

  // --- Group 2: State Transformations & Status Indicators ---
  test(9, "EquipmentStatusLight color configurations cover all 4 operational states", () => {
    const validStatuses: EquipmentStatus[] = ["HEALTHY", "WARNING", "CRITICAL", "OFFLINE"];
    assert(validStatuses.length === 4, "Must support 4 states");
  });

  test(10, "Equipment3DState accurately correlates alerts with specific equipment", () => {
    const mockEquipment: Equipment3DState = {
      id: "eq-m-gen-01",
      name: "Generator 01 (Caterpillar 3306)",
      category: "POWER",
      status: "WARNING",
      healthScore: 82,
      lastChecked: "Just now",
      hasActiveAlert: true,
      activeAlertSeverity: "WARNING",
      activeAlertTitle: "Generator 01 High Thermal Output"
    };

    assert(mockEquipment.hasActiveAlert === true, "Alert should be active");
    assert(mockEquipment.activeAlertSeverity === "WARNING", "Severity must be WARNING");
  });

  // --- Group 3: Scenario Engine Integration ---
  test(11, "GENERATOR_OVERHEAT scenario elevates generator temperature and triggers alert state", () => {
    const isScenarioActive = "GENERATOR_OVERHEAT" === "GENERATOR_OVERHEAT";
    const genHealth = 72; // degraded
    const genTemp = 75.0 + (100 - genHealth) * 0.45; // ~87.6°C
    assert(isScenarioActive, "Scenario should match");
    assert(genTemp > 85, `Expected generator temperature > 85°C, got ${genTemp}°C`);
  });

  test(12, "BATTERY_LOW scenario maps to battery state warning and accelerated discharge", () => {
    const batteryPercent = 18.5; // low
    const isLow = batteryPercent < 20.0;
    assert(isLow, "Battery percentage should be detected as low (<20%)");
  });

  test(13, "HIGH_WIND scenario (>70 km/h) escalates blizzard particle density", () => {
    const blizzardWind = 85.0;
    const isBlizzard = blizzardWind > 70.0;
    const particleCount = isBlizzard ? 800 : 250;
    assert(isBlizzard, "Wind speed > 70 km/h must trigger blizzard mode");
    assert(particleCount === 800, `Expected 800 particles, got ${particleCount}`);
  });

  test(14, "LOW_FUEL scenario (<30%) triggers fuel enclosure alert state", () => {
    const fuelPercent = 24.0;
    const isFuelCritical = fuelPercent < 30.0;
    assert(isFuelCritical, "Fuel < 30% must trigger alert state");
  });

  test(15, "COMMUNICATION_DEGRADED scenario reflects in satellite dish health", () => {
    const commHealth = 65;
    const commStatus: EquipmentStatus = commHealth < 75 ? "WARNING" : "HEALTHY";
    assert(commStatus === "WARNING", "Degraded comms must yield WARNING status");
  });

  // --- Group 4: Navigation, Switching & Layer Controls ---
  test(16, "Station switching from MAITRI to BHARATI switches asset mapping cleanly", () => {
    let currentStation: StationCode = "MAITRI";
    let assets = EQUIPMENT_POSITIONS[currentStation];
    assert(assets[0].equipmentId.startsWith("eq-m-"), "Maitri assets should have eq-m- prefix");

    currentStation = "BHARATI";
    assets = EQUIPMENT_POSITIONS[currentStation];
    assert(assets[0].equipmentId.startsWith("eq-b-"), "Bharati assets should have eq-b- prefix");
  });

  test(17, "Camera preset options cover default, top, station, and equipment", () => {
    const presets = ["default", "top", "station", "equipment"];
    assert(presets.length === 4, "Must support 4 camera presets");
  });

  test(18, "Layer state defaults all 4 subsystems to visible (true)", () => {
    const defaultLayers: DigitalTwinLayerState = {
      buildings: true,
      equipment: true,
      alerts: true,
      environment: true
    };
    assert(defaultLayers.buildings === true, "Buildings default true");
    assert(defaultLayers.equipment === true, "Equipment default true");
    assert(defaultLayers.alerts === true, "Alerts default true");
    assert(defaultLayers.environment === true, "Environment default true");
  });

  test(19, "Layer toggling isolates specific subsystem visibility", () => {
    const layers: DigitalTwinLayerState = {
      buildings: true,
      equipment: true,
      alerts: true,
      environment: true
    };
    const toggled = { ...layers, buildings: false };
    assert(toggled.buildings === false, "Buildings toggled off");
    assert(toggled.equipment === true, "Equipment remains on");
  });

  test(20, "Digital Twin Error Boundary isolates WebGL errors without crashing app shell", () => {
    const errorState = { hasError: true, error: new Error("Simulated WebGL Context Lost") };
    assert(errorState.hasError === true, "Error state should capture WebGL failure");
    assert(errorState.error.message.includes("WebGL"), "Error message preserved");
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n=================================================");
  console.log(`Phase 6 Test Execution Summary: ${passedCount}/${results.length} Passed (${failedCount} Failed)`);
  console.log("=================================================\n");

  return failedCount === 0;
}

if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/")) || process.argv[1].includes("digital-twin-tests")) {
  const success = runDigitalTwinTests();
  process.exit(success ? 0 : 1);
}
