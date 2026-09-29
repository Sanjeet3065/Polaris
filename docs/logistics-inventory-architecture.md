# POLARIS — Phase 8: Logistics & Inventory Management Architecture

**Project:** POLARIS (Polar Operations & Logistics Automated Remote Intelligence System)  
**SIH Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations  
**Target Stations:** Maitri (Schirmacher Oasis) & Bharati (Larsemann Hills)  
**Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)  
**Current Phase:** Phase 8 — Logistics + Inventory

---

## 1. Inventory Architecture

The POLARIS Phase 8 Logistics & Inventory subsystem manages mission-critical Antarctic supplies (Fuel, Medical Supplies, Water Reserves, Food Rations, Science Spares, Safety Gear, etc.) across both Maitri and Bharati research stations. Operating in the extreme polar biome demands absolute stock visibility, deterministic threshold auditing, and rigorous transaction isolation.

```
                 ┌──────────────────────────────────────────────────────────┐
                 │                 POLARIS Frontend Dashboard               │
                 │     /logistics  (Polar Logistics & Inventory Hub)        │
                 └─────────────┬──────────────────────────────┬─────────────┘
                               │                              │
                               ▼                              ▼
                 ┌───────────────────────────┐  ┌───────────────────────────┐
                 │  Inventory Operations UI  │  │  Polar Cargo & Shipments  │
                 │  - Table, Filters, Search │  │  - Manifests, Timeline    │
                 │  - Stock Ledgers, Drawer  │  │  - Intake Modal, Status   │
                 └─────────────┬─────────────┘  └─────────────┬─────────────┘
                               │                              │
                               ▼                              ▼
                 ┌──────────────────────────────────────────────────────────┐
                 │          Unified Logistics Service Client Layer          │
                 │                  (logisticsService.ts)                   │
                 └─────────────────────────────┬────────────────────────────┘
                                               │ HTTP REST
                                               ▼
                 ┌──────────────────────────────────────────────────────────┐
                 │                   Express REST API Layer                 │
                 │       /api/v1/inventory    &    /api/v1/logistics        │
                 └──────────────┬──────────────────────────────┬────────────┘
                                │                              │
                                ▼                              ▼
                 ┌───────────────────────────┐  ┌───────────────────────────┐
                 │    Inventory Controller   │  │    Logistics Controller   │
                 │    & Zod Validators       │  │    & Zod Validators       │
                 └─────────────┬─────────────┘  └─────────────┬─────────────┘
                               │                              │
                               ▼                              ▼
                 ┌───────────────────────────┐  ┌───────────────────────────┐
                 │     Inventory Service     │  │     Logistics Service     │
                 │  - Transaction Isolation  │  │  - Stepper Progression    │
                 │  - Status Evaluator       │  │  - Atomic Cargo Intake    │
                 │  - Negative Stock Guard   │  │  - Event Audit Logger     │
                 └─────────────┬─────────────┘  └─────────────┬─────────────┘
                               │                              │
                               ▼                              ▼
                 ┌──────────────────────────────────────────────────────────┐
                 │          Repositories (Inventory, Movement, Shipment)    │
                 └─────────────────────────────┬────────────────────────────┘
                                               │ Prisma Client
                                               ▼
                 ┌──────────────────────────────────────────────────────────┐
                 │                PostgreSQL Relational Engine              │
                 │  - inventory_items           - shipments                 │
                 │  - inventory_movements       - shipment_items            │
                 │  - operational_events        - stations                  │
                 └──────────────────────────────────────────────────────────┘
```

---

## 2. Logistics Architecture

Polar logistics orchestrates air-drop cargo (C-17 Globemaster, Il-76), polar research vessels (MV *Vasiliy Golovnin*, SA *Agulhas II*), and traverse convoys (PistenBully tractor traverses between Larsemann Hills and Schirmacher Oasis).

The logistics architecture tracks:
1. **Shipment Header (`Shipment`):** Identification number, vessel/carrier name, origin, destination station, lifecycle status, departure/arrival timestamps, operational priority, and cargo manifests.
2. **Shipment Manifest Items (`ShipmentItem`):** Item name, category, quantity, unit, and optional direct linkage to existing inventory items.
3. **Receiving & Cargo Intake Workflow:** A multi-item atomic transaction that shifts manifest items into destination station inventory (updating existing SKUs or provisioning new entries) while marking the shipment as `RECEIVED`.

---

## 3. Database Models

The PostgreSQL schema extensions are codified in `backend/prisma/schema.prisma`:

### Enums
- **`InventoryStatus`:** `IN_STOCK`, `LOW_STOCK`, `CRITICAL`, `OUT_OF_STOCK`, `RESERVED`, `IN_TRANSIT`
- **`StockMovementType`:** `RECEIVED`, `CONSUMED`, `TRANSFERRED`, `ADJUSTED`, `RESERVED`, `RELEASED`
- **`ShipmentStatus`:** `PLANNED`, `READY`, `IN_TRANSIT`, `ARRIVED`, `RECEIVED`, `CANCELLED`
- **`ShipmentPriority`:** `LOW`, `NORMAL`, `HIGH`, `CRITICAL`

### Primary Models

```prisma
model InventoryItem {
  id               String            @id @default(cuid())
  stationId        String
  station          Station           @relation(fields: [stationId], references: [id], onDelete: Cascade)
  sku              String            @unique
  name             String
  category         String            // FUEL, MEDICAL, FOOD, WATER, SCIENCE, SAFETY, etc.
  quantity         Float             @default(0)
  unit             String
  minimumQuantity  Float             @default(0) // Reorder threshold
  criticalQuantity Float             @default(0) // Emergency threshold
  reservedQuantity Float             @default(0) // Locked for planned operations
  storageLocation  String?
  description      String?
  status           InventoryStatus   @default(IN_STOCK)
  lastUpdatedAt    DateTime          @default(now())
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  movements        InventoryMovement[]
  shipmentItems    ShipmentItem[]

  @@index([stationId])
  @@index([category])
  @@index([status])
  @@map("inventory_items")
}

model InventoryMovement {
  id             String            @id @default(cuid())
  itemId         String
  item           InventoryItem     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  stationId      String
  station        Station           @relation(fields: [stationId], references: [id], onDelete: Cascade)
  movementType   StockMovementType
  quantity       Float
  source         String?           // Origin depot / transfer station
  destination    String?           // Target facility / transfer station
  reference      String?           // Batch, manifest, or work ref
  reason         String?
  createdById    String?
  user           User?             @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdAt      DateTime          @default(now())

  @@index([itemId])
  @@index([stationId])
  @@index([movementType])
  @@index([createdAt])
  @@map("inventory_movements")
}

model Shipment {
  id                   String           @id @default(cuid())
  shipmentNumber       String           @unique
  title                String
  origin               String
  destinationStationId String
  station              Station          @relation(fields: [destinationStationId], references: [id], onDelete: Cascade)
  destination          String?
  status               ShipmentStatus   @default(PLANNED)
  priority             ShipmentPriority @default(NORMAL)
  plannedDeparture     DateTime?
  actualDeparture       DateTime?
  estimatedArrival     DateTime?
  actualArrival        DateTime?
  carrier              String?
  notes                String?
  createdById          String?
  user                 User?            @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  items                ShipmentItem[]

  @@index([destinationStationId])
  @@index([status])
  @@index([priority])
  @@map("shipments")
}

model ShipmentItem {
  id          String         @id @default(cuid())
  shipmentId  String
  shipment    Shipment       @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  itemId      String?
  item        InventoryItem? @relation(fields: [itemId], references: [id], onDelete: SetNull)
  name        String
  category    String
  quantity    Float
  unit        String

  @@index([shipmentId])
  @@index([itemId])
  @@map("shipment_items")
}
```

---

## 4. Stock Lifecycle

Stock state is evaluated dynamically by `evaluateInventoryStatus()`:

```
  [Physical Stock Quantity]
              │
              ├─► quantity === 0  ───────────────────────────────────► [OUT_OF_STOCK]
              │
              ├─► (quantity - reservedQuantity) <= criticalQuantity ─► [CRITICAL]
              │
              ├─► (quantity - reservedQuantity) <= minimumQuantity  ──► [LOW_STOCK]
              │
              ├─► reservedQuantity >= quantity  ─────────────────────► [RESERVED]
              │
              └─► quantity > minimumQuantity  ───────────────────────► [IN_STOCK]
```

### Deterministic Status Evaluation Rules
1. **Effective Available Quantity:** `availableQuantity = max(0, quantity - reservedQuantity)`.
2. If `quantity === 0`, status is immediately `OUT_OF_STOCK`.
3. If `availableQuantity <= criticalQuantity`, status is `CRITICAL`.
4. If `availableQuantity <= minimumQuantity`, status is `LOW_STOCK`.
5. If `reservedQuantity >= quantity` and `quantity > 0`, status is `RESERVED`.
6. Otherwise, status is `IN_STOCK`.

---

## 5. Stock Movement Lifecycle

Every change to stock quantities MUST pass through an atomic stock movement:

| Movement Type | Stock Delta | Description | Concurrency / Validation Guard |
| :--- | :--- | :--- | :--- |
| `RECEIVED` | `+quantity` | Supplies arrived via cargo, resupply vessel, or transfer intake | Validates positive quantity |
| `CONSUMED` | `-quantity` | Station operational expenditure (generator fuel, food, spares) | Fails if `quantity - reservedQuantity < amount` |
| `TRANSFERRED` | `-quantity` (source) | Dispatched to sister station via traverse or air corridor | Fails if source available stock is insufficient |
| `ADJUSTED` | `±quantity` | Physical inventory stocktaking audit reconciliation | Fails if adjustment results in negative stock |
| `RESERVED` | `0` (affects `reservedQuantity`) | Earmarked for scientific expeditions or winter emergency | Validates `reservedQuantity + amount <= total quantity` |
| `RELEASED` | `0` (affects `reservedQuantity`) | Unearmarked back to open availability | Validates `reservedQuantity - amount >= 0` |

---

## 6. Shipment Lifecycle

The shipment lifecycle represents polar transit states with strict forward progression:

```
  [PLANNED]
      │
      ▼
   [READY] ──────────► (Cargo staged at Cape Town or Hobart)
      │
      ▼
 [IN_TRANSIT] ───────► (Icebreaker or transport flight underway)
      │
      ▼
  [ARRIVED] ─────────► (Berthing at Larsemann Hills or Maitri ice runway)
      │
      ▼
  [RECEIVED] ────────► (Atomic cargo intake into station inventory items)
      ▲
      │
  [CANCELLED] ───────► (Weather abort, whiteout conditions)
```

Terminal states: `RECEIVED` and `CANCELLED` cannot be regressed to earlier states, protecting inventory audit integrity.

---

## 7. Station Filtering

POLARIS operates under strict multi-station segregation:
- **`MAITRI` (Schirmacher Oasis):** Displays only Maitri inventory, station movements, and inbound shipments.
- **`BHARATI` (Larsemann Hills):** Displays only Bharati inventory, station movements, and inbound shipments.
- **`ALL`:** Aggregated operational view showing dual-station KPIs, inter-station transfer corridors, and comparison cards without blending station ledger records.

Station lookup accommodates both PostgreSQL UUID/CUIDs and normalized station codes (`MAITRI`, `BHARATI`).

---

## 8. Role-Based Access Control (RBAC)

RBAC rules strictly integrate with Phase 3 authentication:

| Action | Admin | Operator | Viewer |
| :--- | :---: | :---: | :---: |
| View Inventory, Movements, Shipments | Yes | Yes (Station-scoped) | Yes (Read-only) |
| Create / Update Inventory Items | Yes | Yes (Assigned station) | No (403 Forbidden) |
| Record Stock Movements (`CONSUMED`, `RECEIVED`) | Yes | Yes (Assigned station) | No (403 Forbidden) |
| Inter-Station Transfer Dispatch | Yes | Yes (Assigned station) | No (403 Forbidden) |
| Create / Update Shipments | Yes | Yes (Assigned station) | No (403 Forbidden) |
| Receive Shipment & Ingest Cargo | Yes | Yes (Assigned station) | No (403 Forbidden) |
| Delete Items / Shipments | Yes | No (403 Forbidden) | No (403 Forbidden) |

---

## 9. Operational Audit Logging

All inventory mutations atomically generate an `OperationalEvent` entry in the PostgreSQL audit log:
- `INVENTORY_CREATED`: Item provisioned with initial quantity
- `STOCK_CONSUMED`: Quantities deducted for station operations
- `STOCK_RECEIVED`: Resupply intake into station stock
- `STOCK_TRANSFERRED`: Inter-station transit records
- `STOCK_ADJUSTED`: Stocktaking discrepancies audited
- `SHIPMENT_CREATED`: Polar cargo manifest logged
- `SHIPMENT_UPDATED`: Status stepper transitions (e.g., departed, arrived)
- `SHIPMENT_RECEIVED`: Complete manifest ingest into station stock

Audit records capture user identity, station reference, item SKU, delta values, and contextual reasons.

---

## 10. Transaction Safety

All multi-step stock mutations run inside atomic database transactions (`prisma.$transaction`):
1. **Stock Movement Execution:**
   - Fetch item and verify existence.
   - Validate availability (`quantity - reservedQuantity >= delta`).
   - Create `InventoryMovement` record.
   - Mutate `InventoryItem.quantity`.
   - Recompute and persist `InventoryItem.status`.
   - Create `OperationalEvent` audit record.
   - Return updated item and movement.
2. **Transfer Execution:**
   - Fetch source and target stations.
   - Verify source item and sufficient available quantity.
   - Atomically decrement source inventory and log `TRANSFERRED` movement.
   - Find or create target station inventory item.
   - Atomically increment target inventory and log `RECEIVED` movement.
   - Create audit events for both stations.
3. **Cargo Intake Execution:**
   - Verify shipment status is not already `RECEIVED`.
   - Update shipment status to `RECEIVED` and set `actualArrival`.
   - For every manifest item, upsert station inventory and record `RECEIVED` movement.
   - Log operational event.

If any sub-operation fails, the entire transaction is rolled back, preventing corrupted or ghost inventory.

---

## 11. Concurrency Protection & Negative Stock Guard

To prevent race conditions where concurrent operators consume the same stock simultaneously:
1. **Pre-check:** `if (item.quantity - item.reservedQuantity < quantity) throw new BadRequestError(...)`.
2. **Atomic Condition:** During the transactional update, the stock deduction asserts `quantity: { gte: requestedQuantity }` or performs an atomic decrement `quantity: { decrement: requestedQuantity }`.
3. **Database Constraint / Invariant:** Quantities are checked prior to writing, and if an update results in `< 0`, an error is raised and the transaction is aborted.

---

## 12. REST API Endpoints

### Inventory Endpoints (`/api/v1/inventory`)
- `GET /api/v1/inventory/overview` — Aggregated KPI metrics (total items, low stock, critical, out of stock, reserved)
- `GET /api/v1/inventory` — Paginated list with filters (`stationId`, `category`, `status`, `search`, `page`, `limit`)
- `GET /api/v1/inventory/:id` — Single inventory item details
- `POST /api/v1/inventory` — Create new inventory item (Admin/Operator)
- `PATCH /api/v1/inventory/:id` — Update item metadata (reorder level, critical level, location)
- `POST /api/v1/inventory/:id/movements` — Record atomic stock movement (`CONSUMED`, `RECEIVED`, etc.)
- `GET /api/v1/inventory/:id/movements` — Fetch movement ledger history for an item
- `POST /api/v1/inventory/transfer` — Execute inter-station stock transfer (Maitri ↔ Bharati)

### Logistics Endpoints (`/api/v1/logistics`)
- `GET /api/v1/logistics/overview` — Active shipment metrics (total, planned, ready, in-transit, arrived, received)
- `GET /api/v1/logistics/shipments` — Paginated shipments list with filters (`stationId`, `status`, `priority`, `search`)
- `GET /api/v1/logistics/shipments/:id` — Single shipment with cargo items and destination station details
- `POST /api/v1/logistics/shipments` — Create shipment manifest (Admin/Operator)
- `PATCH /api/v1/logistics/shipments/:id` — Update shipment metadata or transition lifecycle status
- `POST /api/v1/logistics/shipments/:id/receive` — Atomic cargo intake workflow (manifest items → station inventory)

---

## 13. Frontend Architecture

The user interface is centered at `/logistics`, serving as the **Polar Logistics & Inventory Control Center**:

### Component Tree
```
LogisticsPage.tsx
 ├── InventoryOverviewCards.tsx (Total items, In Stock, Low Stock, Critical, Out of Stock, Reserved)
 ├── LogisticsOverviewCards.tsx (Active manifests, In Transit, Arriving Soon, Received)
 ├── StationInventoryComparison.tsx (Maitri vs Bharati inventory health breakdown)
 ├── ReplenishmentPanel.tsx (Actionable low & critical supply restocking guidance)
 ├── Tab Navigation:
 │    ├─► Tab "inventory":
 │    │    ├── InventoryFilters.tsx (Search, station, category, status, reset)
 │    │    ├── InventoryTable.tsx (Sortable columns, deterministic status badges, action triggers)
 │    │    └── InventoryItemDrawer.tsx (Full SKU metadata & chronological ledger history)
 │    └─► Tab "shipments":
 │         ├── ShipmentTimeline.tsx (Visual stepper: Planned -> Ready -> In Transit -> Arrived -> Received)
 │         ├── ShipmentTable.tsx (Shipment manifests, carrier, priority badges, cargo summary)
 │         └── ShipmentDetailsModal.tsx (Cargo intake action & manifest audit)
 ├── StockMovementModal.tsx (Controlled Consumption & Resupply intake form)
 ├── StockTransferModal.tsx (Inter-station transfer dispatch form)
 └── CreateItemModal.tsx (New inventory item provisioning form)
```

All UI elements adhere to the POLARIS polar blue glassmorphism theme (`border-slate-800`, `bg-slate-900/60`, `backdrop-blur-md`, `font-mono` metrics).

---

## 14. Testing Suite

The Phase 8 implementation is validated by 25 dedicated backend integration tests (`backend/src/__tests__/logistics-inventory-tests.ts`), integrated into the unified runner (`backend/src/__tests__/run-tests.ts`):

- **Group 1: Inventory Item Management & Filtering (5 tests)**
  - List inventory with station filtering
  - Search items by SKU, name, and storage location
  - Category filtering
  - Status evaluation & status filtering
  - Single item retrieval with relations
- **Group 2: Stock Movement Ledger & Negative Stock Safety (5 tests)**
  - Stock receipt increases quantity and logs movement
  - Stock consumption decreases quantity and logs movement
  - Negative stock prevention rejects consumption exceeding available stock
  - Zero stock transition to `OUT_OF_STOCK`
  - Atomic transaction rollback on failure
- **Group 3: Inter-Station Stock Transfer Workflow (3 tests)**
  - Transfer stock from Maitri to Bharati atomically updates source and destination
  - Transfer fails when source stock is insufficient
  - Transfer fails on identical source and destination station
- **Group 4: Shipment Lifecycle & Logistics Operations (5 tests)**
  - Create shipment with cargo items
  - List shipments with station and status filtering
  - Get shipment details with manifest items
  - Shipment status transition stepper
  - Receiving shipment ingests cargo manifest items into inventory
- **Group 5: Role-Based Access Control (RBAC) (3 tests)**
  - ADMIN can create inventory items
  - OPERATOR can record stock movements for assigned station
  - VIEWER is rejected with 403 Forbidden on stock mutations
- **Group 6: Inventory & Logistics KPI Overview Aggregations (2 tests)**
  - Inventory overview aggregates item and status breakdown for station
  - Logistics overview aggregates active and in-transit manifests
- **Group 7: Operational Event Audit Logging (2 tests)**
  - Stock operations generate traceable `OperationalEvent` audit records
  - Comprehensive cleanup of test entities

---

## 15. Known Limitations & Phase Boundaries

1. **No Predictive Demand / AI Forecasting:** All reorder thresholds and replenishment calculations are deterministic (`replenishment = target - current`). AI-based predictive maintenance and demand forecasting belong strictly to Phase 10 / Phase 12.
2. **No Incident Ticket Automation:** Low or critical inventory triggers visual warnings on the inventory dashboard; automatic incident ticket generation belongs to Phase 9 (Alerts & Incidents).
3. **No External Carrier Integration:** Carrier tracking reflects internal NCPOR logistics logs and does not connect to external third-party shipping APIs.
