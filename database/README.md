# POLARIS Database Architecture & Time-Series Strategy

## Overview

The database layer for POLARIS is built on **PostgreSQL** orchestrated through **Prisma ORM** (scheduled for implementation in **Phase 2**).

This design balances relational data integrity (stations, equipment, inventory, users, permissions) with high-throughput time-series sensor ingestion (environmental telemetry, energy flows, and equipment vibration metrics).

---

## High-Level Relational Model

```
Station
  │
  ├── Buildings
  │     └── Floors
  │           └── Rooms
  │                 └── Equipment
  │                       ├── Sensors ──> SensorReadings (Time-Series)
  │                       └── MaintenanceRecords
  ├── InventoryItems
  │     └── InventoryTransactions
  ├── Shipments & SupplyRequests
  ├── EnergyReadings (Time-Series)
  ├── EnvironmentalReadings (Time-Series)
  ├── Alerts ──> Incidents
  └── Users ──> Roles ──> Permissions
```

---

## Core Entities & Responsibilities

| Entity | Category | Description |
| :--- | :--- | :--- |
| `Station` | Hierarchy | Polar research base (Maitri or Bharati), geographic coordinates, capacity. |
| `Building` | Hierarchy | Structural unit (e.g. Main Habitation, Generator Block, Earth Station). |
| `Floor` | Hierarchy | Level within a building. |
| `Room` | Hierarchy | Discrete physical space (e.g. Server Room, Living Quarters, Biological Lab). |
| `Equipment` | Asset | Physical machinery (e.g. Caterpillar DG-3306, Mitsubishi HVAC, RO Water Maker). |
| `EquipmentCategory` | Asset | Classification (POWER, HVAC, LIFE_SUPPORT, COMMUNICATIONS, SCIENTIFIC). |
| `Sensor` | IoT Telemetry | Physical or virtual sensor probe attached to equipment or space. |
| `SensorReading` | Time-Series | Raw and calibrated metric value with millisecond timestamp. |
| `EnergyReading` | Time-Series | Solar kW, generator kW, battery state-of-charge, fuel levels. |
| `EnvironmentalReading`| Time-Series | External ambient temperature, wind velocity, barometric pressure, snow rate. |
| `InventoryItem` | Logistics | Stock item (fuel, freeze-dried food, medical supplies, spare filters). |
| `InventoryTransaction` | Logistics | Consumption, restock, scrap, or relocation audit trail. |
| `Shipment` | Logistics | Polar vessel cargo manifest (e.g. MV Vasiliy Golovnin expedition cargo). |
| `SupplyRequest` | Logistics | Expeditioner resupply requisition with approval workflow. |
| `MaintenanceRecord` | Maintenance | Preventative, corrective, or predictive work orders. |
| `Alert` | Incidents | Real-time threshold breach with severity (INFO to EMERGENCY). |
| `Incident` | Incidents | Formal incident report tracking root cause, containment, and resolution. |
| `User` / `Role` | Security | Expeditioner credentials, role-based access control, session state. |
| `AuditLog` | Security | Immutable log of user actions and security events. |

---

## Time-Series Ingestion & Optimization Strategy

1. **Compound B-Tree Indexing**:
   - `CREATE INDEX idx_sensor_readings_query ON sensor_readings (sensor_id, timestamp DESC);`
   - `CREATE INDEX idx_station_telemetry ON environmental_readings (station_id, timestamp DESC);`
2. **BRIN (Block Range Indexing)**:
   - For historical partitions where records are inserted strictly in chronological order, BRIN indexes reduce index size by over 95%.
3. **Partitioning Strategy (Chronological)**:
   - Table partitioning by range on `timestamp` (monthly partitions):
     - `sensor_readings_2026_01`
     - `sensor_readings_2026_02`
4. **Data Aggregation & Downsampling**:
   - High-frequency telemetry (1-5s intervals) retained at full fidelity for 30 days.
   - Rolled up into 5-minute averages for 180 days.
   - Rolled up into 1-hour averages for multi-year scientific and operational trend analysis.
5. **No Premature Complexity**:
   - Standard PostgreSQL provides over 15,000 writes/sec with connection pooling, well exceeding the 500-1000 events/sec required for Maitri and Bharati demo simulations without requiring extra cluster dependencies like TimescaleDB or InfluxDB.
