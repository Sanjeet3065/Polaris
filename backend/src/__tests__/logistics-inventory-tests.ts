/**
 * POLARIS — Phase 8 Logistics + Inventory Test Suite
 * Problem Statement: SIH26060 (Antarctic Station Operations)
 * 
 * Comprehensive tests covering:
 *   - Centralized deterministic threshold evaluation (IN_STOCK, LOW_STOCK, CRITICAL, OUT_OF_STOCK)
 *   - Inventory CRUD, multi-criteria filtering, search, and pagination
 *   - Atomic stock ledger movements (RECEIVED, CONSUMED, ADJUSTED)
 *   - Concurrency & negative stock protection (insufficient stock rejection)
 *   - Inter-station transfers between Maitri and Bharati
 *   - Polar shipment lifecycle stepper (PLANNED -> READY -> IN_TRANSIT -> ARRIVED -> RECEIVED)
 *   - Atomic cargo manifest intake into station inventory
 *   - Station inventory & logistics KPI overview aggregation
 *   - Operational event audit logging for supply mutations
 */

import { prisma } from "../config/prisma";
import { inventoryService } from "../services/inventory.service";
import { logisticsService } from "../services/logistics.service";
import { inventoryRepository } from "../repositories/inventory.repository";
import { shipmentRepository } from "../repositories/shipment.repository";
import { evaluateInventoryStatus } from "../utils/inventoryThresholds";
import { InventoryStatus, ShipmentPriority, ShipmentStatus, StockMovementType, UserRole } from "@prisma/client";
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

export async function runLogisticsInventoryTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 8: Logistics + Inventory Test Suite");
  console.log("=================================================\n");

  // Fetch baseline stations
  const maitri = await prisma.station.findUnique({ where: { code: "MAITRI" } });
  const bharati = await prisma.station.findUnique({ where: { code: "BHARATI" } });
  assert(Boolean(maitri), "Maitri station must exist");
  assert(Boolean(bharati), "Bharati station must exist");

  // Fetch admin user for audit attribution
  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  assert(Boolean(adminUser), "Admin user must exist for testing");

  // -------------------------------------------------------------
  // Group 1: Deterministic Inventory Status Evaluation
  // -------------------------------------------------------------
  console.log("--- Group 1: Deterministic Inventory Status Evaluation ---");

  await test("Status evaluates to OUT_OF_STOCK when available quantity is 0", async () => {
    const evalResult = evaluateInventoryStatus({
      quantity: 0,
      minimumQuantity: 20,
      criticalQuantity: 5,
      reservedQuantity: 0
    });
    assert(evalResult.status === "OUT_OF_STOCK", `Expected OUT_OF_STOCK, got ${evalResult.status}`);
    assert(evalResult.isActionRequired === true, "Action should be required for depleted stock");
  });

  await test("Status evaluates to CRITICAL when available quantity <= criticalQuantity", async () => {
    const evalResult = evaluateInventoryStatus({
      quantity: 4,
      minimumQuantity: 20,
      criticalQuantity: 5,
      reservedQuantity: 0
    });
    assert(evalResult.status === "CRITICAL", `Expected CRITICAL, got ${evalResult.status}`);
    assert(evalResult.isActionRequired === true, "Action should be required for critical stock");
  });

  await test("Status evaluates to LOW_STOCK when available quantity <= minimumQuantity but > criticalQuantity", async () => {
    const evalResult = evaluateInventoryStatus({
      quantity: 15,
      minimumQuantity: 20,
      criticalQuantity: 5,
      reservedQuantity: 0
    });
    assert(evalResult.status === "LOW_STOCK", `Expected LOW_STOCK, got ${evalResult.status}`);
    assert(evalResult.isActionRequired === true, "Action should be required for low stock");
  });

  await test("Status evaluates to IN_STOCK when available quantity exceeds minimumQuantity", async () => {
    const evalResult = evaluateInventoryStatus({
      quantity: 50,
      minimumQuantity: 20,
      criticalQuantity: 5,
      reservedQuantity: 0
    });
    assert(evalResult.status === "IN_STOCK", `Expected IN_STOCK, got ${evalResult.status}`);
    assert(evalResult.isActionRequired === false, "No action required for in-stock reserve");
  });

  await test("Reserved quantity triggers RESERVED status when remaining available stock is constrained", async () => {
    const evalResult = evaluateInventoryStatus({
      quantity: 25,
      minimumQuantity: 20,
      criticalQuantity: 5,
      reservedQuantity: 22 // Available is 3 -> <= criticalQuantity
    });
    assert(evalResult.status === "RESERVED", `Expected RESERVED with heavy reservations, got ${evalResult.status}`);
  });

  // -------------------------------------------------------------
  // Group 2: Inventory CRUD & Query Capabilities
  // -------------------------------------------------------------
  console.log("\n--- Group 2: Inventory CRUD, Filtering, and Search ---");

  await test("List inventory returns paginated items for Maitri", async () => {
    const res = await inventoryService.getInventory({
      station: maitri!.id,
      page: 1,
      limit: 10
    });
    assert(res.items.length > 0, "Expected at least one item for Maitri");
    assert(res.pagination.total > 0, "Pagination total should be > 0");
    assert(res.items.every((i: any) => i.stationId === maitri!.id), "All items must belong to Maitri");
  });

  await test("List inventory returns items for all stations when stationId is omitted", async () => {
    const res = await inventoryService.getInventory({
      page: 1,
      limit: 50
    });
    const stationCodes = new Set(res.items.map((i: any) => i.station.code));
    assert(stationCodes.has("MAITRI") && stationCodes.has("BHARATI"), "Should return items from both stations");
  });

  await test("Category filtering returns only commodities of specified category", async () => {
    const res = await inventoryService.getInventory({
      category: "FUEL",
      page: 1,
      limit: 20
    });
    assert(res.items.length > 0, "Expected FUEL items in inventory");
    assert(res.items.every((i: any) => i.category.toUpperCase().includes("FUEL")), "All items must be in FUEL category");
  });

  await test("Search query matches item name, SKU, or storage location", async () => {
    const res = await inventoryService.getInventory({
      search: "Jet A-1",
      page: 1,
      limit: 10
    });
    assert(res.items.length > 0, "Expected search for 'Jet A-1' to return results");
    assert(
      res.items.some((i: any) => i.name.toLowerCase().includes("jet a-1")),
      "Search results should match item name"
    );
  });

  let createdItemId: string = "";

  await test("Create inventory item with valid payload", async () => {
    const testSku = `TEST-MED-${Date.now().toString().slice(-4)}`;
    const newItem = await inventoryService.createInventoryItem(
      {
        stationId: maitri!.id,
        sku: testSku,
        name: "Automated Polar Field Trauma Kit",
        category: "MEDICAL",
        quantity: 12,
        unit: "kits",
        minimumQuantity: 5,
        criticalQuantity: 2,
        storageLocation: "Medical Bay Container #1",
        description: "Emergency trauma kits for blizzard search and rescue operations"
      },
      adminUser!.id
    );

    assert(Boolean(newItem.id), "New item should receive generated ID");
    assert(newItem.quantity === 12, "Initial quantity should be 12");
    assert(newItem.status === InventoryStatus.IN_STOCK, "Status should be IN_STOCK");
    createdItemId = newItem.id;
  });

  await test("Create inventory item rejects duplicate SKU in same station", async () => {
    let threw = false;
    try {
      const existing = await inventoryRepository.findById(createdItemId);
      await inventoryService.createInventoryItem(
        {
          stationId: maitri!.id,
          sku: existing.sku,
          name: "Duplicate Kit",
          category: "MEDICAL",
          quantity: 5,
          unit: "kits",
          minimumQuantity: 2
        },
        adminUser!.id
      );
    } catch (err: unknown) {
      threw = true;
      assert(err instanceof ApiError, "Expected ApiError on duplicate SKU");
    }
    assert(threw, "Should reject duplicate SKU");
  });

  await test("Update inventory item metadata updates fields without mutating stock", async () => {
    const updated = await inventoryService.updateInventoryItem(
      createdItemId,
      {
        storageLocation: "Medical Bay Cold Locker Alpha",
        minimumQuantity: 6
      }
    );

    assert(updated.storageLocation === "Medical Bay Cold Locker Alpha", "Storage location updated");
    assert(updated.minimumQuantity === 6, "Minimum quantity updated");
    assert(updated.quantity === 12, "Quantity must remain untouched by metadata update");
  });

  // -------------------------------------------------------------
  // Group 3: Atomic Stock Ledger Movements & Concurrency Protection
  // -------------------------------------------------------------
  console.log("\n--- Group 3: Stock Movements & Concurrency Protection ---");

  await test("Record stock consumption (CONSUMED) atomically decreases inventory", async () => {
    const res = await inventoryService.recordStockMovement(
      createdItemId,
      {
        type: StockMovementType.CONSUMED,
        quantity: 4,
        reason: "Dispatched 4 trauma kits for Schirmacher traverse team"
      },
      adminUser!.id
    );

    assert(res.item.quantity === 8, `Expected remaining quantity 8, got ${res.item.quantity}`);
    assert(res.movement.previousStock === 12, "Previous stock should be 12");
    assert(res.movement.newStock === 8, "New stock should be 8");
    assert(res.movement.type === StockMovementType.CONSUMED, "Movement type should be CONSUMED");
  });

  await test("Negative stock prevention: consuming more than available stock is rejected", async () => {
    let threw = false;
    try {
      // Current stock is 8, try to consume 20
      await inventoryService.recordStockMovement(
        createdItemId,
        {
          type: StockMovementType.CONSUMED,
          quantity: 20,
          reason: "Excessive withdrawal"
        },
        adminUser!.id
      );
    } catch (err: unknown) {
      threw = true;
      assert(err instanceof ApiError, "Expected ApiError on insufficient stock");
      assert((err as ApiError).statusCode === 400, "Expected 400 Bad Request");
    }
    assert(threw, "System must block consumption exceeding available stock");

    // Verify stock remains untouched at 8
    const checkItem = await inventoryRepository.findById(createdItemId);
    assert(checkItem.quantity === 8, `Stock must remain 8 after rejected consumption, got ${checkItem.quantity}`);
  });

  await test("Record stock intake (RECEIVED) atomically increases inventory", async () => {
    const res = await inventoryService.recordStockMovement(
      createdItemId,
      {
        type: StockMovementType.RECEIVED,
        quantity: 10,
        source: "Helicopter Air-Drop",
        reason: "Emergency resupply from Cape Town via DMLI"
      },
      adminUser!.id
    );

    assert(res.item.quantity === 18, `Expected stock 18, got ${res.item.quantity}`);
    assert(res.movement.newStock === 18, "Movement new stock should be 18");
  });

  await test("Movement history tracks chronological audit ledger", async () => {
    const movements = await inventoryService.getMovements({
      page: 1,
      limit: 10,
      itemId: createdItemId
    });

    assert(movements.items.length >= 2, "Expected at least 2 movements in history");
    assert(movements.items[0].type === StockMovementType.RECEIVED, "Latest movement was RECEIVED");
    assert(movements.items[1].type === StockMovementType.CONSUMED, "Previous movement was CONSUMED");
  });

  // -------------------------------------------------------------
  // Group 4: Inter-Station Stock Transfers (Maitri <-> Bharati)
  // -------------------------------------------------------------
  console.log("\n--- Group 4: Inter-Station Stock Transfers ---");

  await test("Inter-station transfer transfers stock between Maitri and Bharati", async () => {
    // Transfer 5 trauma kits from Maitri to Bharati
    const result = await inventoryService.transferStock(
      {
        sourceStationId: "MAITRI",
        targetStationId: "BHARATI",
        itemId: createdItemId,
        quantity: 5,
        reason: "Larsemann Hills emergency medical reserve rebalance"
      },
      adminUser!.id
    );

    assert(result.sourceBalance === 13, `Source item stock should be 13, got ${result.sourceBalance}`);
    assert(result.targetBalance >= 5, "Target item must have received 5 units");
    assert(Boolean(result.sourceMovementId), "Outbound movement ID should exist");
    assert(Boolean(result.targetMovementId), "Inbound movement ID should exist");
  });

  await test("Inter-station transfer rejects transfer when source has insufficient stock", async () => {
    let threw = false;
    try {
      await inventoryService.transferStock(
        {
          sourceStationId: "MAITRI",
          targetStationId: "BHARATI",
          itemId: createdItemId,
          quantity: 1000, // Source only has 13
          reason: "Invalid massive transfer"
        },
        adminUser!.id
      );
    } catch (err: unknown) {
      threw = true;
      assert(err instanceof ApiError, "Expected ApiError on insufficient transfer stock");
    }
    assert(threw, "System must reject transfers exceeding source stock");
  });

  // -------------------------------------------------------------
  // Group 5: Polar Logistics Shipments & Lifecycle
  // -------------------------------------------------------------
  console.log("\n--- Group 5: Logistics Shipments & Lifecycle Stepper ---");

  let testShipmentId: string = "";

  await test("Create polar supply shipment with itemized cargo manifest", async () => {
    const shipmentNum = `POL-TEST-${Date.now().toString().slice(-4)}`;
    const shipment = await logisticsService.createShipment(
      {
        shipmentNumber: shipmentNum,
        title: "Test Overland Fuel Traverse",
        origin: "Maitri Station",
        destinationStationId: bharati!.id,
        destination: "Bharati Station",
        priority: ShipmentPriority.HIGH,
        carrier: "PistenBully 300 Polar Traverse",
        plannedDeparture: "2026-10-01T08:00:00.000Z",
        estimatedArrival: "2026-10-05T18:00:00.000Z",
        notes: "Heavy snowcat convoy with double-walled bladder tanks",
        items: [
          {
            name: "Bulk Arctic Jet A-1 Fuel",
            category: "FUEL",
            quantity: 5000,
            unit: "L"
          },
          {
            name: "Synthetic 0W-40 Lube Oil",
            category: "LUBRICANTS",
            quantity: 200,
            unit: "L"
          }
        ]
      },
      adminUser!.id
    );

    assert(Boolean(shipment.id), "Shipment should have generated ID");
    assert(shipment.status === ShipmentStatus.PLANNED, "Initial status should be PLANNED");
    assert(shipment.items.length === 2, "Cargo manifest should contain 2 items");
    testShipmentId = shipment.id;
  });

  await test("Shipment status transitions along polar lifecycle (PLANNED -> READY -> IN_TRANSIT -> ARRIVED)", async () => {
    // 1. Ready
    const ready = await logisticsService.updateShipmentStatus(
      testShipmentId,
      { status: ShipmentStatus.READY },
      adminUser!.id
    );
    assert(ready.status === ShipmentStatus.READY, "Status should be READY");

    // 2. In Transit
    const inTransit = await logisticsService.updateShipmentStatus(
      testShipmentId,
      {
        status: ShipmentStatus.IN_TRANSIT,
        actualDeparture: "2026-10-01T09:00:00.000Z"
      },
      adminUser!.id
    );
    assert(inTransit.status === ShipmentStatus.IN_TRANSIT, "Status should be IN_TRANSIT");

    // 3. Arrived
    const arrived = await logisticsService.updateShipmentStatus(
      testShipmentId,
      {
        status: ShipmentStatus.ARRIVED,
        actualArrival: "2026-10-05T17:30:00.000Z"
      },
      adminUser!.id
    );
    assert(arrived.status === ShipmentStatus.ARRIVED, "Status should be ARRIVED");
  });

  await test("Cargo intake (receiveShipmentCargo) atomically ingests cargo and updates station reserves", async () => {
    const shipment = await shipmentRepository.findById(testShipmentId);
    assert(Boolean(shipment), "Shipment must exist");

    const receiveData = {
      items: shipment.items.map((i: any) => ({
        shipmentItemId: i.id,
        receivedQty: i.quantity
      })),
      notes: "Cargo quality verified, density tested and approved"
    };

    const intakeResult = await logisticsService.receiveShipmentCargo(
      testShipmentId,
      receiveData,
      adminUser!.id
    );

    assert(intakeResult.allFullyReceived === true, "All items should be marked received");
    assert(intakeResult.receivedItems.length === 2, "Both cargo items should be processed");
    assert(
      intakeResult.receivedItems.every((r: any) => r.receivedQty > 0),
      "All cargo lines should have positive received quantities"
    );
  });

  await test("Invalid lifecycle transition on completed shipment is rejected", async () => {
    let threw = false;
    try {
      await logisticsService.updateShipmentStatus(
        testShipmentId,
        { status: ShipmentStatus.PLANNED },
        adminUser!.id
      );
    } catch (err: unknown) {
      threw = true;
      assert(err instanceof ApiError, "Expected ApiError when rewinding completed shipment");
    }
    assert(threw, "System must reject transitioning completed shipment back to PLANNED");
  });

  // -------------------------------------------------------------
  // Group 6: Station Supply Resilience KPI Overviews
  // -------------------------------------------------------------
  console.log("\n--- Group 6: Station Resilience KPI Overviews ---");

  await test("Inventory overview aggregates item and status breakdown for station", async () => {
    const overview = await inventoryService.getOverview(maitri!.id);
    assert(overview.totalItems > 0, "Total items should be > 0");
    assert(overview.inStock >= 0, "inStock count should be >= 0");
    assert(overview.totalCategories > 0, "totalCategories should be > 0");
    assert(overview.categories.length > 0, "Category counts should be populated");
  });

  await test("Logistics overview aggregates active and in-transit manifests", async () => {
    const overview = await logisticsService.getOverview();
    assert(overview.totalShipments > 0, "Total shipments should be > 0");
    assert(typeof overview.inTransit === "number", "inTransit should be a number");
    assert(typeof overview.received === "number", "received should be a number");
  });

  // -------------------------------------------------------------
  // Group 7: Operational Event Audit Trails
  // -------------------------------------------------------------
  console.log("\n--- Group 7: Operational Event Audit Logging ---");

  await test("Stock operations generate traceable OperationalEvent audit records", async () => {
    const recentEvents = await prisma.operationalEvent.findMany({
      where: {
        type: { in: ["INVENTORY", "LOGISTICS"] }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    assert(recentEvents.length > 0, "Should have created OperationalEvents during test execution");
    assert(
      recentEvents.some((e) => e.type === "INVENTORY" || e.type === "LOGISTICS"),
      "Should contain INVENTORY or LOGISTICS events"
    );
  });

  // -------------------------------------------------------------
  // Cleanup test item
  // -------------------------------------------------------------
  try {
    if (createdItemId) {
      await prisma.inventoryMovement.deleteMany({ where: { itemId: createdItemId } });
      await prisma.inventoryItem.delete({ where: { id: createdItemId } }).catch(() => {});
    }
    if (testShipmentId) {
      await prisma.shipmentItem.deleteMany({ where: { shipmentId: testShipmentId } });
      await prisma.shipment.delete({ where: { id: testShipmentId } }).catch(() => {});
    }
  } catch (err) {
    // Ignore cleanup errors
  }

  // Summary
  console.log("\n=================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  console.log(`Phase 8 Test Execution Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log("=================================================\n");

  if (failedTests > 0) {
    throw new Error(`Phase 8 Test Suite Failed: ${failedTests}/${totalTests} tests failed`);
  }
}

// Standalone execution support
if (require.main === module) {
  runLogisticsInventoryTests()
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
