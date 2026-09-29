# POLARIS — Phase 7: Energy + Environment Monitoring Architecture

**Project:** POLARIS (Polar Operations & Logistics Automated Remote Intelligence System)  
**SIH Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations  
**Target Stations:** Maitri (Schirmacher Oasis) & Bharati (Larsemann Hills)  
**Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)  

---

## 1. System Architecture

The POLARIS Phase 7 monitoring subsystem establishes an operational bridge between the authoritative PostgreSQL database, the Phase 4 IoT Simulator, the Phase 5 Real-Time WebSocket event bus, and the frontend operational control centers (`/energy` and `/environment`).

```
                 ┌───────────────────────────┐
                 │ Phase 4 IoT Simulator     │
                 │ (1Hz telemetry engine)    │
                 └─────────────┬─────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │ PostgreSQL / Prisma       │
                 │ EnergyReading & EnvReading│
                 └─────────────┬─────────────┘
                               │
                               ├──────────────► REST API (Express Controllers)
                               │                 - GET /api/v1/stations/:id/energy/latest
                               ▼                 - GET /api/v1/stations/:id/energy (history)
                 ┌───────────────────────────┐   - GET /api/v1/stations/:id/environment/latest
                 │ Phase 5 Realtime EventBus │   - GET /api/v1/stations/:id/environment (history)
                 └─────────────┬─────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │ Existing WebSocket Client │
                 │ (telemetry:update stream) │
                 └─────────────┬─────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │ Existing StationContext   │
                 │ (Live state + Stale check)│
                 └─────────────┬─────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
      ┌────────────────────┐       ┌────────────────────┐
      │ Energy Monitoring  │       │ Environment        │
      │ Control Center     │       │ Monitoring Center  │
      │ (/energy)          │       │ (/environment)     │
      └────────────────────┘       └────────────────────┘
                │                             │
                └──────────────┬──────────────┘
                               ▼
                    ┌────────────────────┐
                    │ Digital Twin       │
                    │ Live 3D Overlay    │
                    │ (/digital-twin)    │
                    └────────────────────┘
```

---

## 2. Energy Data Flow & Microgrid Routing

### Generation & Consumption Topology
Station microgrids operate on hybrid generation comprising Solar Photovoltaics (PV) and Arctic Diesel Cogeneration (DG1/DG2) feeding a central synchronous 415V / 50Hz AC / 480V DC distribution bus:

1. **Power Generation Sources:**
   - **Solar PV Arrays:** Real-time generation (`solarGenerationKw`), active during polar daylight.
   - **Diesel Cogeneration:** Continuous baseline (`dieselGenerationKw`) coupled with thermal exhaust heat recovery for building district heating.
   - **Total Generation:** Mathematically strictly equals $P_{\text{gen}} = P_{\text{solar}} + P_{\text{diesel}}$.

2. **Station Load Demand:**
   - Base consumption tracking (`totalConsumptionKw`) allocating power to life-support heating (45%), laboratories (35%), communications, and secondary auxiliary systems.

3. **Net Power Balance:**
   - Mathematical formula:
     $$\text{Net Power Balance} = P_{\text{gen}} - P_{\text{demand}}$$
   - **Surplus ($\text{Net} > +2\text{ kW}$):** Directs excess generation to Lithium-Iron-Phosphate (LiFePO4) battery storage bank charging.
   - **Equilibrium ($-2\text{ kW} \le \text{Net} \le +2\text{ kW}$):** Microgrid balanced, battery float voltage steady.
   - **Deficit ($\text{Net} < -2\text{ kW}$):** Station draws supplemental current from battery bank; severe deficit ($< -50\text{ kW}$) triggers priority circuit load shedding advisory.

4. **Battery Energy Storage Subsystem:**
   - State of charge (`batteryPercentage`, 0–100% SoC)
   - Bus Voltage (`batteryVoltageV`, nominal 480V DC, critical floor 460V DC)
   - Operating State (`CHARGING` | `STABLE` | `DISCHARGING`)

5. **Bulk Fuel Reserves:**
   - Aviation-grade Jet A-1 / Arctic diesel storage (`fuelReservesPercent`, `fuelReservesLiters`)
   - Days of operational autonomy (`fuelAutonomyDaysRemaining` / `estimatedFuelDaysRemaining`).

---

## 3. Environment Data Flow & Automatic Weather Stations (AWS)

Polar Automatic Weather Stations (AWS) situated at Schirmacher Oasis (Maitri) and Larsemann Hills (Bharati) transmit high-frequency environmental telemetry:

- **Ambient Temperature (`temperatureCelsius`):** Monitored against sub-zero polar operating envelopes (-60°C to +5°C).
- **Wind Velocity & Vector (`windSpeedKmh`, `windDirectionDegrees`, `windDirectionCompass`):** Continuous monitoring of Katabatic drainage winds descending from the continental Antarctic ice sheet.
- **Barometric Pressure (`atmosphericPressureHpa`):** Precision solid-state barometric sensor monitoring pressure trends to detect incoming polar cyclonic depressions.
- **Relative Humidity (`humidityPercentage` / `relativeHumidityPercent`):** Dry polar atmospheric moisture tracking.
- **Optical Visibility (`visibilityKm`):** Optical transmissometer feeds detecting blowing snow and whiteout hazards.
- **Solar Irradiance (`solarRadiationWattsPerM2`):** Incident solar flux measured by pyranometer instrumentation.

---

## 4. REST vs. WebSocket Responsibilities

To guarantee consistency, performance, and avoid architectural redundancy, POLARIS maintains a strict hybrid data model:

| Capability | REST API (HTTP) | WebSocket (WS) |
| :--- | :--- | :--- |
| **Primary Responsibility** | Authoritative historical queries, range filtering, pagination, initialization | High-frequency live streaming, instantaneous state transitions |
| **Frequency** | On-demand (page mount, range selector, station switch, manual refresh) | Continuous push (1Hz telemetry broadcast) |
| **Payload Scope** | Historical array of readings with pagination metadata | Compact instantaneous delta with environment, energy, equipment status |
| **Resilience / Sync** | Retries on network failure, token refresh via cookie | Sequence tracking, automatic reconnect, heartbeat ping/pong (30s) |

---

## 5. Threshold System & Operational Status Evaluation

All operational thresholds are centralized in `frontend/src/utils/thresholds.ts` and grounded in Phase 4 simulation physics and Antarctic safety protocols:

### Energy Thresholds
- **Battery State of Charge (SoC):**
  - `CRITICAL`: $\le 20\%$ or $V_{\text{bus}} < 460\text{V}$ (Alarms BATTERY_LOW scenario boundary)
  - `WARNING`: $\le 35\%$ or $V_{\text{bus}} < 480\text{V}$
  - `NORMAL`: $> 35\%$
- **Fuel Reserves:**
  - `CRITICAL`: $\le 20\%$ or $\le 14$ days autonomy remaining (Alarms LOW_FUEL boundary)
  - `WARNING`: $\le 40\%$ or $\le 30$ days autonomy remaining
  - `NORMAL`: $> 40\%$
- **Net Power Balance:**
  - `CRITICAL`: $\le -50\text{ kW}$ (Severe generation deficit, matches POWER_SHORTAGE)
  - `WARNING`: $\le -15\text{ kW}$ (Minor battery discharge draw)
  - `NORMAL`: $> -15\text{ kW}$ (Equilibrium or surplus charging)

### Environmental Thresholds
- **Ambient Temperature:**
  - `CRITICAL`: $\le -55^\circ\text{C}$ (Extreme Polar Hazard)
  - `WARNING`: $\le -40^\circ\text{C}$ (Severe Subzero Chill)
  - `NORMAL`: $> -40^\circ\text{C}$
- **Wind Speed:**
  - `CRITICAL`: $\ge 80\text{ km/h}$ (Katabatic Blizzard, zero outdoor movement, matches HIGH_WIND)
  - `WARNING`: $\ge 50\text{ km/h}$ (High Gale Advisory)
  - `NORMAL`: $< 50\text{ km/h}$
- **Barometric Pressure:**
  - `CRITICAL`: $\le 955\text{ hPa}$ (Rapid Cyclonic Plunge)
  - `WARNING`: $\le 970\text{ hPa}$ (Storm Front Approaching)
  - `NORMAL`: $> 970\text{ hPa}$
- **Optical Visibility:**
  - `CRITICAL`: $\le 1.0\text{ km}$ (Whiteout Conditions)
  - `WARNING`: $\le 5.0\text{ km}$ (Restricted Polar Air)
  - `NORMAL`: $> 5.0\text{ km}$

---

## 6. Live Update Flow & Stale Telemetry Handling

1. Client connects to WebSocket via existing singleton `polarisWebSocketClient`.
2. On authentication, client subscribes to selected station (`MAITRI`, `BHARATI`, or both if `ALL`).
3. Inbound `telemetry:update` events dispatch to `StationContext`:
   - Live energy records updated with full property sets and backward-compatible aliases.
   - Live environment records updated.
   - Timestamp recorded in `lastTelemetryAt`.
   - `isStale` flag reset to `false`.
4. **Watchdog Timer:** A 5-second interval evaluates `Date.now() - lastTelemetryAt`. If elapsed time exceeds 20 seconds (`STALE_THRESHOLD_MS`), `isStale` is set to `true`.
5. Visual indicators in `EnergyLiveIndicator` and `EnvironmentLiveIndicator` transition from `LIVE TELEMETRY` (pulsing green) to `STALE SENSOR DATA` (pulsing amber with elapsed lag seconds).

---

## 7. Historical Query Flow & Selectable Time Windows

1. Upon user selecting a time window (`1h`, `6h`, `24h`, `7d`), `EnergyHistoricalChart` and `EnvironmentHistoricalChart` invoke `telemetryService.getCombinedEnergyHistory` / `getCombinedEnvironmentHistory`.
2. Calculations derive UTC `from` and `to` ISO timestamps.
3. Backend controller validates query parameters via Zod `historyQuerySchema` (confirming `from <= to` and `limit <= 100`).
4. Prisma executes filtered, indexed query against PostgreSQL.
5. In the event of no records within the explicit window, frontend implements clean fallback querying latest available historical entries, preventing empty dashboards during time skips.

---

## 8. Station Filtering & Multi-Base Operations

- **Maitri View (`MAITRI`):** Displays telemetry, historical records, and alerts strictly isolated to Maitri Station.
- **Bharati View (`BHARATI`):** Displays telemetry, historical records, and alerts strictly isolated to Bharati Station.
- **Combined Overview (`ALL`):**
  - Aggregates combined microgrid generation ($P_{\text{Maitri}} + P_{\text{Bharati}}$) and demand.
  - Computes averaged ambient temperatures, barometric pressures, and peak wind speeds.
  - Dynamically renders `EnergyStationComparison` and `EnvironmentStationComparison` displaying normalized side-by-side metric ratios and relative comparison bars.

---

## 9. Scenario Integration & Anomaly Correlation

Phase 7 directly consumes scenarios produced by Phase 4 without creating duplicate alert engines:

- **`GENERATOR_OVERHEAT`:** Visually elevated in `GeneratorEnergyCard` showing critical status and warning banner when cooling temperature rises.
- **`BATTERY_LOW`:** Highlights `BatteryMonitoringCard` with accelerated discharge state, amber/rose borders, and scenario advisory banner.
- **`POWER_SHORTAGE`:** Highlights `PowerBalanceFlow` with deficit net balance badge and load shedding status.
- **`LOW_FUEL`:** Triggers fuel farm warning in `FuelMonitoringCard` when bulk reserves drop below 20%.
- **`HIGH_WIND`:** Triggers Katabatic Blizzard alert in `WindMonitorCard`, displaying severe storm advisory.
- **`COMMUNICATION_DEGRADED`:** Escalates telemetry staleness and link degradation indicators.

---

## 10. Phase 6 Digital Twin Integration

Phase 7 maintains full compatibility with the Phase 6 3D Digital Twin (`/digital-twin`):
- The 3D scene continues to consume `environment.windSpeedKmh` to dynamically scale Katabatic blizzard snow particles.
- Equipment 3D light states synchronize with generator and battery health telemetry.
- No duplicate 3D canvases or conflicting WebGL contexts are instantiated.

---

## 11. Error Handling & Empty States

All energy and environment components adhere to resilient UI design:
- **Loading States:** Non-blocking backdrop spinners and skeleton representations during initial fetches.
- **Empty States:** Clear informational cards (e.g. `No historical energy readings available for this time range`) without fabricating random data.
- **Error States:** Informative error cards with retry buttons to re-trigger database queries.
- **Never 0 kW Fallback:** Missing or uninitialized data displays "Telemetry Pending" or clear placeholders rather than false 0 kW readings.

---

## 12. Verification & Test Suite Summary

- **Backend Unified Test Suite:** 141/141 tests passing (100%)
  - Phase 2 (Database & REST APIs): 24/24 passed
  - Phase 3 (Auth & RBAC): 28/28 passed
  - Phase 4 (IoT Simulator): 28/28 passed
  - Phase 5 (WebSocket Realtime): 33/33 passed
  - Phase 7 (Energy + Environment): 28/28 passed
- **Frontend Test Suite:** 20/20 Phase 6 Digital Twin tests passing (100%)
- **TypeScript & Linting:** 0 type errors across both backend and frontend (`tsc --noEmit`).
- **Production Build:** Both backend (`dist/server.js`) and frontend (`dist/assets/index-*.js`) compile cleanly.
