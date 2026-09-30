# POLARIS — COMPLETE USER FLOW VERIFICATION

**Project:** POLARIS (Polar Operations & Logistics Automated Remote Intelligence System)  
**SIH Problem Statement:** SIH26060  
**Stations:** Maitri & Bharati  
**Document Purpose:** Verification of User Journeys, RBAC Security, Cross-Module Flows, and Edge Cases  
**Audit Date:** 2026-09-30  

---

## 1. End-to-End User Journeys

### 1.1 Viewer Journey (Read-Only Observer)
1. **Application Launch & Authentication:**
   - Navigates to `/login`.
   - Enters credentials for `viewer@polaris.ncpor.res.in`.
   - Backend authenticates password, creates session record, and sets HttpOnly refresh token cookie.
   - Access token (15m) issued in memory.
   - App automatically navigates to `/overview` without manual refresh.
2. **Dashboard Initialization:**
   - Station context defaults to authorized station (`MAITRI`).
   - REST hydration fetches latest energy & environmental records from PostgreSQL.
   - Realtime WebSocket establishes connection (`/ws?token=...`) with subprotocol `polaris-auth`.
   - Live KPI cards display power balance, battery SoC (%), temperature (-28.4°C), and station health (98%).
3. **Station Switching:**
   - User switches station selector to `BHARATI`.
   - Station context updates state store; WebSocket sends `station:subscribe` for `BHARATI`.
   - Digital Twin re-centers on Bharati's coordinates and architectural layout.
   - Energy graphs, environment cards, equipment lists, and active alerts update in unison.
4. **Read-Only Enforcement:**
   - Viewer visits `/equipment`, `/alerts`, `/logistics`, and `/settings`.
   - Mutation controls (Acknowledge, Escalate, Transfer Stock, Create Work Order) are cleanly disabled or read-only.
   - Direct API attempts to mutate yield `403 Forbidden`.
5. **Logout:**
   - User clicks Logout.
   - Backend revokes session and clears refresh token cookie.
   - In-memory access token wiped, WebSocket connection terminated cleanly, and query cache cleared.
   - Protected routes instantly redirect to `/login`.

---

### 1.2 Operator Journey (Tactical Station Control)
1. **Login & Station Monitoring:**
   - Operator logs in with `operator.maitri@polaris.ncpor.res.in`.
   - Granted operational privileges for `MAITRI`.
2. **Anomaly & Alert Response:**
   - Simulator triggers `GENERATOR_OVERHEAT` scenario.
   - Generator temperature rises past 90°C.
   - Alert Engine evaluates rule `EQUIP_OVERHEAT_CRITICAL` and writes alert to DB.
   - WebSocket broadcasts `alert:created` and `equipment:update`.
   - Dashboard alert counter turns red; 3D Digital Twin Generator 01 mesh flashes in red.
   - Operator clicks the alert in `/alerts`, clicks "Acknowledge", and inputs operator notes.
   - Operator escalates the alert to an active Incident (`INC-MAITRI-xxxx`, Investigating).
3. **Maintenance & Logistics Coordination:**
   - Operator navigates to `/maintenance` to inspect AI predictive health score and estimated RUL.
   - Operator checks required replacement parts in `/logistics` inventory.
   - Stock movement recorded (`RESERVED`) for maintenance work order.
4. **Mitigation & Verification:**
   - Station load shedding command or simulator recovery deactivates scenario.
   - Generator temperature returns to baseline.
   - Operator marks Incident as `RESOLVED` with resolution summary.

---

### 1.3 Administrator Journey (System Governance & Auditing)
1. **Administrative Access:**
   - Admin logs in with `admin@polaris.ncpor.res.in`.
   - Unrestricted access across both stations (`MAITRI`, `BHARATI`, and `ALL`).
2. **User & Station Governance:**
   - Navigates to `/settings` and user management views.
   - Audits system authentication logs (`/api/v1/auth/events`), inspecting IP addresses, user agents, and security event types.
   - Reviews system performance metrics (`/api/v1/system/realtime`) showing connected WebSocket clients, message rates, and sequence numbers.
3. **Exporting Operational Reports:**
   - Navigates to `/reports`.
   - Generates Comprehensive Station Operational Summary (PDF / CSV / HTML).
   - Verifies CSV formula sanitization and XSS escaping in print preview.

---

### 1.4 SIH Demo Mode (Scripted 60-Second Demonstration)
1. **Act 1: Station Baseline (0s – 5s)**
   - All systems nominal; Maitri reporting 98% health. Real-time telemetry streaming smoothly.
2. **Act 2: Katabatic Storm Onset (5s – 18s)**
   - Wind velocity accelerates to 115 km/h; ambient temperature plunges.
   - High wind warning alert triggers and broadcasts across UI.
3. **Act 3: Power Generation Crisis (18s – 32s)**
   - Solar array output drops; microgrid experiences severe power imbalance (-48 kW).
   - Battery bank enters rapid discharging state; CRITICAL energy alert fires.
4. **Act 4: Generator Thermal Runaway (32s – 48s)**
   - Backup diesel generator temperature surges to 111°C.
   - Generator 01 status changes to CRITICAL; 3D Digital Twin mesh highlights failure.
   - AI Maintenance model projects RUL drop; Incident command triggered.
5. **Act 5: Automated Response & Recovery (48s – 60s)**
   - Scenarios stopped; automated emergency load shedding active.
   - Microgrid stabilizes, generator cools to safe baseline, station health recovers to 96%.
   - Demo completes at exactly 60.0 seconds and returns application to live operations.

---

## 2. Cross-Module Consistency Matrix

| Event / Trigger | Energy Page | Environment Page | Equipment Page | 3D Digital Twin | Alerts Page | Maintenance Page | AI Assistant |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **High Wind Gale** | Normal grid | Wind > 80 km/h (Blizzard Warning) | Unaffected | Wind particles accelerate | Environmental Alert created | Unaffected | Reports storm conditions |
| **Solar Power Loss** | Solar = 0 kW, Deficit | Unaffected | Inverters warning | Substation mesh amber | Energy Alert created | Unaffected | Explains power deficit |
| **Generator Overheat** | Diesel power warning | Unaffected | Generator 01 CRITICAL (111°C) | Generator 01 mesh flashes RED | Critical Alert & Incident created | RUL decreases, High Risk | Identifies thermal fault |
| **Station Switch (Maitri -> Bharati)** | Bharati power grid | Bharati weather (-24°C, 35km/h) | Bharati equipment assets | Bharati spatial building model | Bharati alerts only | Bharati predictions | Scopes answers to Bharati |

---

## 3. Security & Hardening Audit Verification

- **POL-SEC-01 (CSV Formula Injection):** Cell content starting with `=`, `+`, `-`, or `@` is prepended with `'` to prevent spreadsheet macro execution. (VERIFIED)
- **POL-SEC-02 (Stored XSS & HTML Escaping):** Report HTML generation uses rigorous entity escaping for all user and station fields. (VERIFIED)
- **POL-SEC-03 (WebSocket Origin Validation):** Handshake strictly verifies allowed origins and rejects unauthorized hosts. (VERIFIED)
- **POL-SEC-04 (Sensitive Data Log Redaction):** Passwords, JWT secrets, Bearer tokens, and API keys are automatically redacted by structured winston logger. (VERIFIED)
- **POL-SEC-05 (AI Assistant Prompt Guard):** Assistant queries enforce allowlisted tool calling; prompt injection attempts to bypass station scoping or execute mutations are blocked. (VERIFIED)
