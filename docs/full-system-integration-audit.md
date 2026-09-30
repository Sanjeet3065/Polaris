# POLARIS — FULL SYSTEM INTEGRATION AUDIT

**Project:** POLARIS (Polar Operations & Logistics Automated Remote Intelligence System)  
**SIH Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations  
**Target Stations:** Maitri & Bharati  
**Document Purpose:** Comprehensive Architectural & Operational Audit of Phases 0 through 16 as a Unified System  
**Audit Date:** 2026-09-30  
**Version:** 1.0.0-PROD  

---

## 1. System Architecture & Operational Pipeline

POLARIS operates as a synchronized distributed system designed to deliver real-time Antarctic station visibility, predictive telemetry, equipment management, incident command, and AI assistance.

### End-to-End Operational Pipeline
```
[Simulator / Hardware Sensors (Maitri & Bharati)]
                     │
                     ▼
[Telemetry Ingestion & Persistence Engine]
(Zod validated -> Prisma -> PostgreSQL `telemetry`, `energy_readings`, `environmental_readings`)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
[Domain Event Bus]        [Alert Evaluation Engine]
(`telemetry.tick`)        (Multi-condition rule engine -> Deduplication)
         │                       │
         ▼                       ▼
[Realtime WebSocket]      [Alert & Incident Lifecycle]
(JWT auth, rate limits)   (`alerts`, `incidents`, `incident_alerts`)
         │                       │
         └───────────┬───────────┘
                     ▼
       [Frontend WebSocket Client]
        (`polarisWebSocketClient`)
                     │
                     ▼
             [StationContext]
   (Authoritative station-scoped state store)
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
[Dashboard]    [3D Digital Twin]   [Energy & Environment]
(Live KPIs)    (Three.js models)   (Power & life support)
     │               │               │
     └───────────────┼───────────────┘
                     ▼
          [Equipment & Maintenance]
   (DB UUID & Code mapping -> AI Service Health/RUL)
                     │
                     ▼
             [Logistics & Inventory]
     (Stock ledger, transfers, manifest receipts)
                     │
                     ▼
              [Analytics & Reports]
       (Aggregated historical DB metrics)
                     │
                     ▼
             [AI Operations Assistant]
   (Allowlisted backend tools, station-scoped grounding)
                     │
                     ▼
              [SIH Demo Mode]
    (60-second end-to-end multi-act operational drill)
```

---

## 2. Single Source of Truth Enforcement

To eliminate split-brain data states, POLARIS enforces strict authoritative boundaries:

1. **Authentication & Session:**
   - **Authority:** Backend `AuthService` with PostgreSQL `users`, `sessions`, and `refresh_tokens`.
   - **Frontend:** In-memory Bearer token + HttpOnly cookie with automatic silent rotation.
2. **Authorization (RBAC):**
   - **Authority:** Backend `authorize(Role)` middleware enforcing `ADMIN`, `OPERATOR`, `VIEWER`.
   - **Frontend:** `ProtectedRoute` guards and contextual capability toggling.
3. **Station Context:**
   - **Authority:** Backend station permissions + Frontend `StationContext.tsx`.
   - **Rule:** Switching station (`MAITRI` <-> `BHARATI`) propagates synchronously to all 12 modules.
4. **Telemetry & Sensors:**
   - **Authority:** PostgreSQL `telemetry` table + Realtime WebSocket event stream (`telemetry:update`).
   - **Rule:** Live UI updates originate exclusively from validated simulator cycles and database records.
5. **Equipment & Spatial Models:**
   - **Authority:** PostgreSQL `equipment` table + `EquipmentBaselineSpec` + `EQUIPMENT_POSITIONS`.
   - **Rule:** Equipment health changes update the 3D mesh shaders, maintenance predictions, and alert badges simultaneously.
6. **Alerts & Incidents:**
   - **Authority:** Backend `AlertEngine` and `IncidentService`.
   - **Rule:** Incidents link to real alerts; alert escalation transitions states from `OPEN` to `INVESTIGATING`, `MITIGATING`, and `RESOLVED`.
7. **Predictive Maintenance:**
   - **Authority:** FastAPI AI Service (`/predict/health`) with deterministic mathematical fallback.
   - **Rule:** RUL, health score (0–100), and risk categories reflect physical telemetry trends.
8. **Logistics & Inventory:**
   - **Authority:** PostgreSQL `inventory_items`, `inventory_movements`, and `shipments`.
   - **Rule:** Stock deductions and transfers maintain an immutable audit ledger (`inventory_movements`).
9. **Reports & Exports:**
   - **Authority:** Backend `ReportService` running aggregated SQL queries.
   - **Security:** Formula injection sanitization (`'` prefix on `=, +, -, @`) and HTML entity escaping.
10. **AI Operations Assistant:**
    - **Authority:** Backend `AssistantService` invoking allowlisted tools (`get_station_status`, `query_telemetry`, `list_active_alerts`, `check_equipment_health`, etc.).
    - **Rule:** The LLM cannot access PostgreSQL directly, cannot execute arbitrary code, and respects current user station scoping.

---

## 3. Disconnected Systems Identified & Resolved

### POL-ISSUE-01: Double Path Prefix (`/api/v1/api/v1`) in `alertService.ts`
- **Identified Defect:** `apiClient`'s `baseURL` included `/api/v1`. `alertService.ts` hardcoded `/api/v1` in all endpoints (e.g. `/api/v1/alerts/overview`).
- **Resolution:** Stripped `/api/v1` prefix from all ~20 endpoints.
- **Verification:** All alert/incident REST queries now resolve cleanly to `/alerts/...`.

### POL-ISSUE-02: Double `.data.data` Access Discrepancy
- **Identified Defect:** `apiClient.ts`'s response interceptor returned `response.data`. In `alertService.ts`, `maintenanceService.ts`, `analyticsService.ts`, and `reportService.ts`, methods returned `res.data.data`, evaluating to `undefined` at runtime.
- **Resolution:** Updated Axios call types to `<unknown, ApiResponseEnvelope<T>>` and returned `res.data` (the typed payload `T`).
- **Verification:** Analytics graphs, maintenance predictions, alerts overview, and report downloads now receive valid payloads.

### POL-ISSUE-03: Equipment ID Disconnect between Simulator / DB and Digital Twin
- **Identified Defect:** Simulator and database emit UUIDs and codes (`MAITRI-GEN-01`), whereas frontend mock data used `eq-m-gen-01`.
- **Resolution:** Added `equipmentCode?: string;` to simulator health cycles and WebSocket payloads. In `StationContext.tsx`, implemented multi-pattern matching across UUID, canonical code, normalized token, and model number.
- **Verification:** Live generator degradation during simulator drills now immediately turns the 3D generator mesh critical and updates equipment cards.

### POL-ISSUE-04: Missing Initial REST Telemetry Hydration & Reconnect Resync
- **Identified Defect:** `StationContext` relied solely on static mock data when first opening the app or after network reconnects.
- **Resolution:** Added an initial REST fetch effect using `telemetryService.getLatestEnergy` and `telemetryService.getLatestEnvironment`, and registered a listener with `polarisWebSocketClient.onResync()`.
- **Verification:** Real persisted telemetry loads instantly on login and refreshes automatically after WebSocket reconnections.

### POL-ISSUE-05: Missing Direct `/incidents` Route
- **Identified Defect:** Direct navigation to `/incidents` resulted in `NotFoundPage`.
- **Resolution:** Added `<Route path="/incidents" element={<AlertsPage initialTab="incidents" />} />` in `AppRoutes.tsx` and enabled `initialTab` in `AlertsPage.tsx`.
- **Verification:** Deep links and direct navigation to `/incidents` open the Incidents tab cleanly.

### POL-ISSUE-06: `UserRole` Enum Divergence
- **Identified Defect:** `frontend/src/types/index.ts` defined 6 legacy roles, diverging from Prisma DB and `auth.ts` (`ADMIN`, `OPERATOR`, `VIEWER`).
- **Resolution:** Aligned `UserRole` in `types/index.ts` to `"ADMIN" | "OPERATOR" | "VIEWER"`.
- **Verification:** TypeScript compiles cleanly across frontend and backend.

### POL-ISSUE-07: Legacy WebSocket Server Stub in `server.ts`
- **Identified Defect:** `backend/src/server.ts` initialized obsolete `webSocketManager` alongside production `realtimeService`.
- **Resolution:** Removed legacy `webSocketManager.initialize(server)`.
- **Verification:** Server boots cleanly with `realtimeService` as the sole WebSocket handler.

### POL-ISSUE-08: Calibrated SIH Demo Timing (Exactly 60s)
- **Identified Defect:** SIH Demo duration was set to 62s in backend.
- **Resolution:** Calibrated `TOTAL_DURATION_SECONDS = 60` and adjusted Act 5 to T+48s.
- **Verification:** Demo runs through all 5 acts and completes in exactly 60.0 seconds.

---

## 4. Verification & Validation Summary

| Test Suite | Commands Executed | Result |
| :--- | :--- | :--- |
| **Backend TypeScript Check** | `npm run typecheck` | PASS (0 errors) |
| **Backend Lint** | `npm run lint` | PASS (0 errors) |
| **Backend Build** | `npm run build` | PASS (0 errors) |
| **Simulator Tests** | `npm run simulator:test` | PASS (100% pass) |
| **Realtime WebSocket Tests** | `npm run websocket:test` | PASS (33/33 passed) |
| **Alerts & Incidents Tests** | `npm run test:phase9` | PASS (38/38 passed) |
| **Energy & Environment Tests**| `npm run test:phase7` | PASS (28/28 passed) |
| **Logistics & Inventory Tests**| `npm run test:phase8` | PASS (25/25 passed) |
| **Analytics & Reports Tests** | `npm run test:phase11` | PASS (19/19 passed) |
| **AI Assistant Tests** | `npm run test:phase12` | PASS (26/26 passed) |
| **Security Hardening Tests** | `npm run test:security` | PASS (32/32 passed) |
| **Core Integration Runner** | `npm test` | PASS (All suites pass) |
| **Frontend TypeScript Check**| `npm run typecheck` | PASS (0 errors) |
| **Frontend Lint** | `npm run lint` | PASS (0 errors) |
| **Frontend Production Build**| `npm run build` | PASS (Vite production bundle generated in 40.77s) |
| **AI Service Unit Tests** | `python -m pytest` | PASS (16/16 passed in 0.88s) |
