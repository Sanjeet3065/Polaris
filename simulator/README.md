# POLARIS Telemetry & Sensor Simulator Specification

## Overview

Due to the extreme physical isolation of Antarctica, live hardware streams from **Maitri** (-70.7667°S, 11.7333°E) and **Bharati** (-69.4072°S, 76.1917°E) are subject to satellite blackout periods and security constraints.

The **POLARIS Simulator Engine** (scheduled for implementation in **Phase 4**) provides a physics-based synthetic telemetry generator designed to mimic actual Antarctic environmental and operational dynamics with realistic microclimate variations and equipment degradation curves.

---

## Simulated Telemetry Domains & Ranges

### 1. Environmental Sensors
* **Ambient Temperature**: -60.0°C to +5.0°C (seasonal variations, sudden drops during blizzards).
* **Relative Humidity**: 20% to 90%.
* **Atmospheric Pressure**: 950 hPa to 1035 hPa (rapid drops signaling Katabatic storms).
* **Wind Speed**: 0 to 180 km/h (severe blizzard threshold > 90 km/h).
* **Wind Direction**: 0° to 360° (prevailing south-easterly Katabatic winds).
* **Visibility**: 0.05 km (whiteout) to 50 km (clear polar sky).
* **Snowfall / Accumulation**: 0 to 25 mm/h.
* **Solar Irradiance**: 0 W/m² (polar night: May to August) to 1100 W/m² (24-hour polar day: November to February).

### 2. Energy & Power Systems
* **Solar PV Array Generation**: 0 to 65 kW (active during polar summer).
* **Diesel Generators (DG1, DG2, DG3)**: 0 to 150 kW per unit.
* **Station Total Load Demand**: 45 kW (idle/summer) to 180 kW (heavy heating/winter).
* **Battery Bank Storage**: 0% to 100% State of Charge (SoC); 400V to 520V DC bus.
* **Fuel Farm Level**: 0 to 120,000 Liters (Jet A-1 / Arctic Grade Diesel).
* **Generator Coolant & Exhaust Temp**: 75°C to 105°C (warning > 98°C, trip > 105°C).

### 3. Indoor Infrastructure & Life Support
* **Living & Laboratory Room Temperature**: +18.0°C to +23.0°C.
* **HVAC Air Circulation Flow**: 2,500 to 5,000 m³/h.
* **Server Room Temperature**: +16.0°C to +21.0°C (alert > 26.0°C).
* **Potable Water Storage & RO Unit Status**: 5,000 to 25,000 Liters; melt-tank heater status.
* **Fire & Smoke Detection Loop**: Binary status per room zone.

### 4. Critical Equipment Telemetry
* **Generator Vibration (RMS)**: 0.5 to 8.5 mm/s (bearing wear indicator).
* **HVAC Compressor Pressure**: 12 to 24 bar.
* **Satellite VSAT Signal-to-Noise Ratio (SNR)**: 4 dB to 18 dB (drop during snow fade).
* **Greywater Recycling Biological Reactor**: Dissolved oxygen and flow rate.

---

## Simulation Operational Modes

| Mode | Trigger / Condition | Characteristics |
| :--- | :--- | :--- |
| **`NORMAL`** | Standard Operations | Stable load, nominal temperatures, routine generator rotation. |
| **`WARNING`** | Minor degradation | Bearing vibration rises to 4.5 mm/s, battery SoC drops below 35%. |
| **`CRITICAL`** | Life-support risk | Primary generator overheats (102°C), room temp falls below 14°C. |
| **`STORM`** | Blizzard Event | Winds > 120 km/h, visibility < 200m, solar irradiance drops to 0. |
| **`POWER_FAILURE`**| Grid Blackout | DG1 trip, instant switch to battery emergency bank, load shedding. |
| **`EQUIPMENT_FAILURE`**| Mechanical lockup| HVAC compressor failure, rapid temperature divergence. |

---

## Architectural Data Flow (Phase 4)

```
┌──────────────────────────────────────────────┐
│           POLARIS Simulator Engine           │
│  - Realistic Random Walk + Markov Chain      │
│  - Physics constraints & thermal loss laws   │
└──────────────────────┬───────────────────────┘
                       │ JSON Telemetry Packet (Every 2-5s)
                       ▼
┌──────────────────────────────────────────────┐
│        Node.js Backend Ingestion API         │
│  - Zod Validation                            │
│  - PostgreSQL Write (Time-Series Table)      │
│  - Socket.IO Broadcast                       │
└──────────────────────┬───────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
React Dashboard             3D Digital Twin Mesh
(Live gauges & charts)     (Heatmap & status lights)
```
