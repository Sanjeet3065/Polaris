# POLARIS Phase 11 — Analytics & Intelligence Architecture

## 1. System Overview

The **POLARIS Analytics & Intelligence Engine** transforms historical operational telemetry, environmental records, equipment diagnostics, alert cycles, incidents, logistics transactions, and Phase 10 AI predictive maintenance evaluations into actionable operational intelligence for station operators at **Maitri** and **Bharati**, and mission commanders at NCPOR (Goa) and MoES (New Delhi).

The system operates strictly on **real database records** with deterministic aggregation algorithms, mathematically neutral trend detection, and explicit data quality gating.

---

## 2. Core Architecture

The analytics backend follows a modular, domain-driven architecture under `backend/src/services/analytics/`:

```
backend/src/services/analytics/
├── analytics.types.ts           # Central analytics TypeScript interfaces & enums
├── analyticsUtils.ts            # Mathematical aggregation, trends & data quality logic
├── energyAnalytics.service.ts   # Power generation, consumption, solar & fuel analytics
├── environmentAnalytics.service.ts # Weather, katabatic wind, Blizzard thresholds
├── equipmentAnalytics.service.ts   # Fleet health distribution, operational status
├── maintenanceAnalytics.service.ts # Phase 10 AI predictive integration & RUL advisory
├── alertAnalytics.service.ts    # Alarm lifecycle, MTTA, MTTR, rule recurrence
├── incidentAnalytics.service.ts # Incident lifecycle, severity, resolution latency
├── logisticsAnalytics.service.ts# Inventory movements, consumption, resupply status
├── stationComparison.service.ts # Neutral, side-by-side Maitri vs Bharati benchmark
├── analytics.service.ts         # Top 10 KPI grid, executive summary & coordinator
└── report.service.ts            # Operational report generation, CSV & HTML/PDF export
```

---

## 3. Analytics Data Sources

The analytics system utilizes existing PostgreSQL models via Prisma ORM:

| Domain | Primary Prisma Data Models | Key Extracted Fields |
| :--- | :--- | :--- |
| **Stations** | `Station` | `id`, `code`, `name`, `latitude`, `longitude`, `status` |
| **Energy** | `EnergyReading` | `generationKw`, `consumptionKw`, `solarKw`, `dieselKw`, `netPowerKw`, `batteryPercent`, `fuelPercent`, `fuelDaysRemaining` |
| **Environment** | `EnvironmentalReading` | `temperature`, `humidity`, `pressure`, `windSpeed`, `windDirection`, `visibility`, `solarRadiation`, `snowfallRate` |
| **Equipment** | `Equipment`, `EquipmentHealth` | `id`, `name`, `code`, `type`, `healthPercent`, `status`, `roomId` |
| **Maintenance** | `MaintenancePrediction`, `MaintenanceRecord` | `healthScore`, `riskScore`, `riskBand`, `estimatedRulDays`, `recommendation`, `workOrders` |
| **Alerts** | `Alert` | `id`, `title`, `severity`, `status`, `ruleId`, `occurredAt`, `acknowledgedAt`, `resolvedAt` |
| **Incidents** | `Incident`, `IncidentAlert`, `IncidentNote` | `id`, `title`, `severity`, `status`, `category`, `startedAt`, `resolvedAt`, `closedAt` |
| **Logistics** | `InventoryItem`, `InventoryMovement`, `Shipment` | `quantity`, `reservedQuantity`, `minThreshold`, `type` (CONSUMPTION, RECEIPT, TRANSFER), `status` |

---

## 4. Time Windows & Filter System

### Supported Time Ranges
- `1h`: Last 1 hour
- `6h`: Last 6 hours
- `24h`: Last 24 hours (Default)
- `7d`: Last 7 days
- `30d`: Last 30 days
- `custom`: Explicit ISO-8601 `startDate` and `endDate` range

### Filter Validation Rules
- `startDate < endDate`
- Maximum allowed window: 365 days
- All internal calculations and storage use **UTC**.
- Station access strictly enforced by user role (`ADMIN`, `OPERATOR`, `VIEWER`).

---

## 5. Mathematical Formulas & Calculation Logic

### 1. Percentage Change
$$\Delta\% = \frac{\text{Current} - \text{Previous}}{\text{Previous}} \times 100$$
- If `Previous == 0` or missing: returns `null` (avoiding division-by-zero fabrication).

### 2. Neutral Trend Detection
Trends are classified mathematically without subjective bias:
- **RISING**: $\Delta\% > +2.0\%$
- **FALLING**: $\Delta\% < -2.0\%$
- **STABLE**: $-2.0\% \le \Delta\% \le +2.0\%$
- **INSUFFICIENT_DATA**: Sample count $< 2$ or baseline unavailable

*Note: For metrics such as power consumption, changes are reported neutrally (e.g., `+8.2% vs previous period`) rather than labeling as "degradation" or "improvement".*

### 3. Net Power Balance
$$\text{Net Power (kW)} = \text{Generation (kW)} - \text{Consumption (kW)}$$

### 4. Inventory Availability
$$\text{Available Stock} = \text{Quantity} - \text{Reserved Quantity}$$

### 5. Latency Durations
- **Mean Time to Acknowledge (MTTA)**:
  $$\text{MTTA} = \frac{\sum (\text{acknowledgedAt} - \text{occurredAt})}{\text{count of acknowledged alerts}}$$
- **Mean Time to Resolution (MTTR)**:
  $$\text{MTTR} = \frac{\sum (\text{resolvedAt} - \text{occurredAt})}{\text{count of resolved alerts}}$$
*(Computed only when both lifecycle timestamps exist; never fabricated).*

---

## 6. Data Quality & Coverage Gating

To maintain scientific integrity across Antarctic telemetry streams, data quality is evaluated based on sample completeness:

- **GOOD**: $\ge 90\%$ expected telemetry coverage
- **LIMITED**: $50\% - 89.9\%$ expected coverage
- **POOR**: $< 50\%$ expected coverage

If expected sampling frequency cannot be determined or records are missing:
- Returns `dataQuality: "POOR"` with `completenessScore: 0`
- Displays explicit `"Data gap detected"` indicators rather than interpolating values silently.

---

## 7. Role-Based Access Control (RBAC)

| Role | Station Scope | Permissions |
| :--- | :--- | :--- |
| **ADMIN** | ALL, MAITRI, BHARATI | Full access to overview, cross-station comparisons, and operational reports. |
| **OPERATOR** | Authorized assigned station | View analytics and reports for assigned station. Requests for other stations are rejected with `403 Forbidden`. |
| **VIEWER** | Authorized assigned station | Read-only viewing of station analytics. |

Station isolation is enforced at the controller and database level: query parameter manipulations such as `?stationId=OTHER` are rejected if the user is not an `ADMIN` or not assigned to that station.

---

## 8. Limitations & Boundary Rules

1. **Advisory AI Data**: Phase 10 predictive maintenance outputs are labeled strictly as `"AI-assisted prediction • Advisory only"`.
2. **No LLM Chatbot**: Executive operational summaries are generated using deterministic logic templates, strictly preserving the boundary of Phase 12 (AI Operations Assistant).
3. **No Winner in Station Comparison**: Maitri and Bharati operate under fundamentally different geographic and structural conditions (inland rocky oasis vs. coastal containerized outpost); metrics are displayed side-by-side with neutral descriptors.
