# POLARIS 3D Digital Twin Architecture (Phase 6)

> **POLARIS** — Polar Operations & Logistics Automated Remote Intelligence System  
> *“A Digital Twin for Smarter Antarctic Station Management”*  
> **Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations (Maitri & Bharati)  
> **Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)

---

## 1. Digital Twin Purpose & Operational Role

The 3D Digital Twin serves as a spatial mission-control bridge connecting remote polar operations at NCPOR headquarters in Goa with physical reality at **Maitri** (Schirmacher Oasis) and **Bharati** (Larsemann Hills).

Rather than being a decorative 3D animation, the digital twin functions as an **OPERATIONAL VISUALIZATION**:
* **Spatial Situational Awareness**: Remotely inspect physical machinery placement, building cutaways, and utility piping across Antarctic bases.
* **Instant State Comprehension**: Healthy equipment shows subtle green indicators; warning states shift to amber breathing glow; critical failures and active alerts emit pulsing red beacons and highlight affected equipment in the 3D canvas.
* **Scenario Response**: Real-time feedback when the Phase 4 simulation engine triggers failure scenarios (e.g. `GENERATOR_OVERHEAT`, `HIGH_WIND` Katabatic storms, `BATTERY_LOW`, `LOW_FUEL`).

---

## 2. Component Architecture

```
                    ┌───────────────────────────┐
                    │    Phase 5 WebSocket      │
                    │      (Native 'ws')        │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │      StationContext       │
                    │   (Live Telemetry Bus)    │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │      DigitalTwinPage      │
                    │   (Responsive Terminal)   │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │     DigitalTwinCanvas     │
                    │   (R3F WebGL Viewport)    │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │       StationModel        │
                    ├─────────────┬─────────────┤
                    │             │             │
                    ▼             ▼             ▼
             ┌────────────┐ ┌───────────┐ ┌───────────┐
             │ Buildings  │ │ Equipment │ │Environment│
             │(Maitri /   │ │ (7 Model  │ │(Snow/Wind/│
             │ Bharati)   │ │  Types)   │ │ Nunataks) │
             └────────────┘ └───────────┘ └───────────┘
                    ▲             ▲             ▲
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                     ┌──────────────────────────┐
                     │     Alerts & Status      │
                     │  (3D Beacons & Tooltips) │
                     └──────────────────────────┘
```

---

## 3. 3D Scene Architecture & Lighting

The 3D environment is rendered via **React Three Fiber (R3F)** and **Three.js** with zero external heavy assets:
* **Lighting Model**:
  - `ambientLight` (#e0f2fe, intensity 0.45) simulating low-scatter Antarctic skylight.
  - `directionalLight` (#ffffff, intensity 1.2) representing low polar sun elevation.
  - Secondary rim light (#38bdf8, intensity 0.3) illuminating shaded ice crevasses.
  - Dynamic `pointLight` sources on warning/critical equipment projecting realistic local emissive glows.
* **Ground & Geography**:
  - 120m x 120m procedural snow & blue ice ground plane.
  - **Maitri**: Features Lake Priyadarshini frozen blue meltwater ice patch with water pump house and utility pipeline.
  - **Bharati**: Features coastal Prydz Bay ice shelf edge and elevated nunatak granite rock formations.
* **Katabatic Wind Snow Particles**:
  - Procedural `THREE.Points` particle system with dynamic wind vectors tied to `environment.windSpeedKmh`.
  - When wind speed exceeds 70 km/h or `HIGH_WIND` scenario is active, particle count scales from 250 to 800 particles with accelerated horizontal drift.

---

## 4. Station Model Implementation

### Maitri Station (Commissioned 1989, Schirmacher Oasis)
* **Modular Stilt Construction**: 16m x 8m main living and laboratory block elevated on 10 heavy steel foundation pillars to prevent snow entrapment.
* **Insulated Sandwich Panels**: Orange/yellow polar facade with double-glazed window bands and thermal airlock entrance tunnel.
* **Safety Power House**: Detached generator building housing DG1 and DG2 with rooftop exhaust flues.
* **Lake Priyadarshini Pump Station**: West perimeter meltwater pump house with insulated heated utility pipelines.

### Bharati Station (Commissioned 2012, Larsemann Hills)
* **Aerodynamic Monocoque Envelope**: Sleek faceted composite aluminum hull wrapping 134 intermodal shipping containers.
* **Hydraulic Elevation Pylons**: Heavy circular columns lifting the structure 2.5m above bedrock.
* **Panoramic Observation Facade**: Multi-pane tinted glass wall looking out over polar ice sheets.
* **Rooftop Solar PV Array & Heli-deck**: Tilted photovoltaic panels capturing polar sunlight and circular emergency helicopter landing markings.
* **East Machinery Wing & Coastal Tracking Platform**: Dedicated cogeneration module and 4-meter C-Band satellite radome dome.

---

## 5. Equipment Mapping

Centralized in [`equipmentPositions.ts`](file:///c:/Users/SANJEET%20CHAUHAN/Desktop/New%20folder%20(3)/frontend/src/components/digital-twin/equipmentPositions.ts):

| Station | Equipment ID | Name | Category | 3D Coordinates `[x, y, z]` | Procedural Model Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Maitri** | `eq-m-gen-01` | Generator 01 (Caterpillar 3306) | POWER | `[10.5, 0.8, -4.0]` | `GENERATOR` |
| **Maitri** | `eq-m-gen-02` | Generator 02 (Auxiliary Standby) | POWER | `[13.5, 0.8, -4.0]` | `GENERATOR` |
| **Maitri** | `eq-m-conv-01` | DC-AC Power Converter Bus | POWER | `[12.0, 0.8, -1.2]` | `CONVERTER` |
| **Maitri** | `eq-m-hvac-01` | Central HVAC Heating Unit | HVAC | `[0.0, 3.4, 1.2]` | `HVAC` |
| **Maitri** | `eq-m-comm-01` | VSAT Satellite Primary Terminal | COMMUNICATION | `[-6.5, 4.4, -6.0]` | `ANTENNA` |
| **Maitri** | `eq-m-water-01` | Lake Priyadarshini Water Pump | WATER_SYSTEM | `[-13.5, 0.6, 5.5]` | `WATER_PUMP` |
| **Maitri** | `eq-m-bat-01` | Emergency Battery Bank Strings | POWER | `[6.0, 0.8, 6.5]` | `BATTERY` |
| **Maitri** | `eq-m-fuel-01` | Fuel Farm Manifold & Heating | LIFE_SUPPORT | `[14.5, 1.0, 6.0]` | `FUEL_TANK` |
| **Bharati** | `eq-b-gen-01` | Generator 01 (Volvo Penta Primary) | POWER | `[8.5, 1.0, -3.5]` | `GENERATOR` |
| **Bharati** | `eq-b-gen-02` | Generator 02 (Cogeneration DG2) | POWER | `[11.5, 1.0, -3.5]` | `GENERATOR` |
| **Bharati** | `eq-b-conv-01` | Hybrid Microgrid Inverter Rack | POWER | `[10.0, 1.0, 0.0]` | `CONVERTER` |
| **Bharati** | `eq-b-hvac-01` | Air Handling Unit (AHU Block A) | HVAC | `[0.0, 5.0, 2.0]` | `HVAC` |
| **Bharati** | `eq-b-comm-01` | C-Band Earth Station Tracking Dish | COMMUNICATION | `[-10.5, 3.2, -6.5]` | `ANTENNA` |
| **Bharati** | `eq-b-water-01` | Reverse Osmosis Seawater Desal Unit | WATER_SYSTEM | `[-12.5, 0.8, 5.0]` | `WATER_PUMP` |
| **Bharati** | `eq-b-bat-01` | Main Lithium-Iron Substation Battery | POWER | `[7.5, 0.8, 6.0]` | `BATTERY` |
| **Bharati** | `eq-b-fuel-01` | Double-Walled Arctic Fuel Enclosure | LIFE_SUPPORT | `[15.5, 1.1, 5.0]` | `FUEL_TANK` |

---

## 6. Telemetry & WebSocket Integration

* The Digital Twin receives live updates strictly from `StationContext`.
* When the Phase 4 simulator executes a tick and persists records, Phase 5 WebSockets emit `telemetry:update` and `equipment:update` frames.
* The 3D scene consumes these changes reactively without triggering whole-canvas re-renders.

---

## 7. Equipment Interaction & Diagnostics Panel

* **Hover**: Highlights 3D model, changes cursor, and reveals Drei `<Html>` tooltip with equipment name and health percentage.
* **Click**: Selects asset and opens the right-hand `EquipmentInfoPanel`:
  - Operational state badge (`HEALTHY`, `WARNING`, `CRITICAL`, `OFFLINE`).
  - Health index score (0–100%).
  - Estimated electrical load % and core operating temperature (°C).
  - Hardware model specification and physical station building module.
  - Active subsystem alerts with severity and description.
  - `[Focus Camera on Asset]` button to smoothly dolly camera to target.
* **Deselect**: Clicking canvas background restores the comprehensive `StationInfoPanel`.

---

## 8. Alert & Scenario Visual Response

* **`GENERATOR_OVERHEAT`**:
  - Engine block pulses with glowing red-orange emissive aura.
  - Floating 3D octahedron alert beacon with rotating pulse ring.
  - Estimated generator temperature scales above 85°C.
* **`BATTERY_LOW`**:
  - Substation battery container status indicator shifts to warning amber.
  - Diagnostic LED bar shows low state of charge.
* **`HIGH_WIND`**:
  - Katabatic storm snow particle system surges to 800 particles with high-velocity drift.
  - Wind speed telemetry reflects real-time storm readings (> 70 km/h).
* **`LOW_FUEL`**:
  - Fuel tanks and manifold pipe display warning status indicator.

---

## 9. Camera Controls & Navigation Presets

Managed by `DigitalTwinControls.tsx` using Drei `OrbitControls`:
* **Presets**:
  - `[Reset View]`: Default isometric observation perspective `[24, 18, 28]`.
  - `[Top View]`: Top-down structural cutaway perspective `[0, 48, 0.1]` looking down on the station footprint.
  - `[Station View]`: Wide perimeter angle capturing base, nunataks, and lake/coast.
  - `[Focus Asset]`: Smooth spherical interpolation (lerp) focusing directly on selected equipment.
* **Safety Bounds**:
  - `minDistance`: 6m (prevents clipping inside geometries).
  - `maxDistance`: 75m (prevents losing station in fog).
  - `maxPolarAngle`: $\pi / 2 - 0.05$ (prevents camera dipping below ground ice).

---

## 10. Performance Optimization (60 FPS Strategy)

* **Static vs Dynamic Separation**: Geometries and materials for buildings and terrain are created once; only dynamic values (emissive intensity, scale, HTML text) update on frame.
* **Geometry Simplicity**: Built using low-poly Three.js primitives (`boxGeometry`, `cylinderGeometry`, `sphereGeometry`).
* **Resource Cleanup**: All event listeners and animation frames clean up properly on unmount.
* **Single Render Loop**: All animations (HVAC fans, radar sweep, snow particles) run within R3F's single unified `useFrame` loop.

---

## 11. Error Boundary & Graceful Degradation

* Wrapped in `DigitalTwinErrorBoundary.tsx`.
* If a WebGL context loss or shader compilation error occurs:
  - The canvas displays a clean recovery panel: `DIGITAL TWIN TEMPORARILY UNAVAILABLE`.
  - Provides a `[Retry 3D Initialization]` action.
  - Standard 2D telemetry, charts, and navigation remain completely uninterrupted.
