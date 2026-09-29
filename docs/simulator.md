# POLARIS Telemetry & Sensor Simulator Specification (Phase 4)

## 1. Overview & Architecture

In live Antarctic operations, satellite communication (VSAT/Iridium) to **Maitri** (-70.767°S, 11.733°E) and **Bharati** (-69.407°S, 76.187°E) is bandwidth-constrained and intermittent. During development, integration testing, and SIH demonstrations, a live sensor testbed is simulated using a stateful, physics-informed simulation engine.

The **POLARIS Sensor / IoT Simulator** generates high-fidelity telemetry spanning atmospheric conditions, electrical microgrid power flows, and mechanical equipment diagnostics. It persists cycles atomically to PostgreSQL using Prisma transactions and exposes secure, RBAC-protected REST management endpoints.

```
                              ┌────────────────────────────────────────┐
                              │            POLARIS Backend             │
                              │        (Express + TypeScript)          │
                              └──────────────────┬─────────────────────┘
                                                 │
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │          SimulatorService              │
                              │     • Lifecycle Management             │
                              │     • Duplicate Loop Prevention        │
                              │     • Error Isolation                  │
                              └───────┬────────────────────────┬───────┘
                                      │                        │
             ┌────────────────────────┴────────┐      ┌────────┴───────────────────────┐
             ▼                                 ▼      ▼                                ▼
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│     ScenarioEngine      │      │    SimulationEngine     │      │   RandomProvider        │
│ • 8 Anomaly Scenarios   │      │ • Temporal State Cache  │      │ • Deterministic PRNG    │
│ • Intensity & Duration  │      │ • Dynamic Inertia       │      │   (Mulberry32 + Box-    │
│ • Baseline Recovery     │      │ • Asset Identification  │      │    Muller Gaussian)     │
└────────────┬────────────┘      └─────────────┬───────────┘      └────────────┬────────────┘
             │                                 │                               │
             └────────────────────────┬────────┴───────────────────────────────┘
                                      ▼
                        ┌───────────────────────────────┐
                        │      Physics Generators       │
                        │ • EnvironmentGenerator        │
                        │ • EnergyGenerator             │
                        │ • EquipmentGenerator          │
                        │ • StationGenerator            │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │ TelemetryPersistenceService   │
                        │ • Atomic Prisma Transaction   │
                        │ • station_telemetry           │
                        │ • environmental_readings      │
                        │ • energy_readings             │
                        │ • equipment_health & status   │
                        │ • station health & status     │
                        └──────────────┬────────────────┘
                                       │
                                       ▼
                        ┌───────────────────────────────┐
                        │     PostgreSQL Database       │
                        └───────────────────────────────┘
```

---

## 2. Sensor Domains & Realistic Antarctic Physics

### 2.1 Environmental & Atmospheric Physics
- **Diurnal Solar Curve**: Calculates solar irradiance ($W/m^2$) based on solar elevation angle, latitude, and day-of-year solar declination. Nighttime clamps solar radiation to $0\ W/m^2$.
- **Barometric Pressure**: Mean-reverting stochastic walk with bounds $[920\ \text{hPa}, 1045\ \text{hPa}]$.
- **Wind & Visibility Coupling**: High wind speeds ($> 60\ \text{km/h}$) kick up drifting snow and blizzard conditions, lowering visibility from $> 10\ \text{km}$ down to $< 0.2\ \text{km}$.
- **Temperature Limits**: Clamped strictly between $-65.0^\circ\text{C}$ and $+10.0^\circ\text{C}$.

### 2.2 Energy & Microgrid Physics
- **Power Flow Balance**:
  $$\text{netPowerKw} = \text{generationKw} - \text{consumptionKw}$$
  $$\text{generationKw} = \text{solarKw} + \text{dieselKw}$$
- **Battery State of Charge (SoC)**:
  - If $\text{netPowerKw} > 0$: Battery charges ($\eta_{\text{charge}} = 92\%$).
  - If $\text{netPowerKw} < 0$: Battery discharges ($\eta_{\text{discharge}} = 95\%$).
  - Clamped within $[0.0\%, 100.0\%]$.
- **Battery Voltage Correlation**: Correlated linearly to state of charge across nominal 48V DC bus ($44.0\text{V}$ empty to $53.5\text{V}$ full charge).
- **Diesel Fuel Consumption**:
  - Specific Fuel Consumption: $0.24\ \text{L/kWh}$ for active diesel generators.
  - Days Remaining dynamically estimated:
    $$\text{daysRemaining} = \frac{\text{fuelLiters}}{\text{dailyBurnRate}}$$

### 2.3 Equipment Degradation & Diagnostics
- **Thermal Inertia**: Generator and HVAC operating temperatures adjust gradually toward load equilibrium:
  $$T_{t+1} = T_t + \alpha (T_{\text{target}} - T_t)$$
- **Vibration Signatures**:
  - Generators: $0.8 - 2.5\ \text{mm/s}$ (Normal), $> 4.5\ \text{mm/s}$ (Warning), $> 7.0\ \text{mm/s}$ (Critical).
  - HVAC / Pumps: $0.4 - 1.8\ \text{mm/s}$.
- **Runtime Accumulation**: Continuous tracking of cumulative operational hours.

### 2.4 Station Composite Health Index
The station health percentage is an automated weighted composite:
$$\text{Health}_{\text{station}} = 0.35 \times \text{Health}_{\text{equip}} + 0.35 \times \text{Health}_{\text{energy}} + 0.30 \times \text{Health}_{\text{env}}$$

---

## 3. Operational Scenarios (8 Presets)

The simulator includes 8 predefined scenario engines with configurable intensity ($0.0 - 1.0$) and duration:

| Scenario Code | Target Subsystem | Primary Dynamics | Recovery Behavior |
| :--- | :--- | :--- | :--- |
| `NORMAL` | Full Station | Baseline nominal operation with natural diurnal noise. | Steady state baseline. |
| `GENERATOR_OVERHEAT` | DG1 / DG2 | Coolant temperature climbs to $98^\circ\text{C}-115^\circ\text{C}$; vibration exceeds $6.5\ \text{mm/s}$. | Exponential cooling to $82^\circ\text{C}$ on scenario deactivation. |
| `BATTERY_LOW` | Energy Storage | Artificial load spike drives net power negative; SoC depletes rapidly below $25\%$. | Solar/diesel replenishment restores SoC. |
| `HIGH_WIND` | Atmospheric | Katabatic wind gusts to $110-160\ \text{km/h}$; barometric pressure drops; visibility falls $< 0.3\ \text{km}$. | Gradual wind subsidence over subsequent ticks. |
| `POWER_SHORTAGE` | Microgrid Grid | Diesel capacity throttled; consumption exceeds generation; battery discharges. | Generators return to nominal rated output. |
| `LOW_FUEL` | Logistics / Fuel | Fuel reserve burn rate triples; tank level decreases towards alarm thresholds. | Burn rate normalizes to baseline $0.24\ \text{L/kWh}$. |
| `COMMUNICATION_DEGRADED` | VSAT / Satellite | Link quality drops; latency spikes; satellite antenna health degraded. | Signal strength stabilizes to nominal levels. |
| `EQUIPMENT_DEGRADATION` | HVAC / Water RO | Mechanical wear on bearings and heating elements reduces equipment health below $60\%$. | Health stabilizes; pending maintenance reset. |

---

## 4. API Endpoints & RBAC Security

All simulator endpoints are mounted under `/api/v1/simulator` and require JWT authentication via `authenticate` middleware. Mutating endpoints enforce role-based access control via `authorize([UserRole.ADMIN, UserRole.OPERATOR])`.

| Method | Endpoint | Description | Roles Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/simulator/status` | Current loop state, interval, active scenarios, baseline summary | `ADMIN`, `OPERATOR`, `VIEWER` |
| `POST` | `/api/v1/simulator/start` | Starts background simulation loop with optional interval and noise level | `ADMIN`, `OPERATOR` |
| `POST` | `/api/v1/simulator/stop` | Halts background simulation loop and active timers | `ADMIN`, `OPERATOR` |
| `POST` | `/api/v1/simulator/restart` | Restarts simulation loop with optional new configuration | `ADMIN`, `OPERATOR` |
| `POST` | `/api/v1/simulator/tick` | Executes single manual simulation tick and persists to PostgreSQL | `ADMIN`, `OPERATOR` |
| `GET` | `/api/v1/simulator/scenarios` | Catalog of all 8 available anomaly scenarios | `ADMIN`, `OPERATOR`, `VIEWER` |
| `POST` | `/api/v1/simulator/scenarios/start` | Activates anomaly scenario on specified station (`MAITRI` or `BHARATI`) | `ADMIN`, `OPERATOR` |
| `POST` | `/api/v1/simulator/scenarios/stop` | Deactivates active anomaly scenario and initiates baseline recovery | `ADMIN`, `OPERATOR` |

---

## 5. CLI & Standalone Scripts

- **Execute Single Tick Manually:**
  ```bash
  npm run simulator:tick
  # or from backend directory:
  npm --prefix backend run simulator:tick
  ```
- **Execute Standalone Simulator Test Suite (30 Tests):**
  ```bash
  npm run simulator:test
  # or from backend directory:
  npm --prefix backend run simulator:test
  ```
- **Run Full Verification Suite (Phase 2, 3 & 4 - 85 Tests):**
  ```bash
  npm --prefix backend test
  ```

---

## 6. Forward Compatibility with Phase 5 (WebSockets)

The simulator is architected with clean separation between generation, persistence, and broadcasting:
- `SimulatorService.executeTick()` returns structured telemetry objects.
- In **Phase 5 (WebSocket & Event Streaming)**, a broadcast hook will be connected directly to `executeTick()`, publishing delta events to connected Socket.IO / WebSocket rooms without requiring any changes to the physics engine or database schemas.
