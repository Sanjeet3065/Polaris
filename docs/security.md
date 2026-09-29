# POLARIS Security, Compliance & Governance Framework
## Polar Operations & Logistics Automated Remote Intelligence System
### Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)
**Stations**: Maitri & Bharati • **SIH Problem**: SIH26060

---

## 1. Security Architecture Overview

POLARIS operates in high-latitude polar environments managing critical Antarctic research bases (**Maitri** in Schirmacher Oasis and **Bharati** in Larsemann Hills). Due to reliance on intermittent satellite links, satellite backhauls, and the physical remoteness of polar crews, the system enforces a strict **Defense-in-Depth** and **Zero-Trust** security architecture.

```
       Internet / Remote Scientist Ingress
                      │
                      ▼
       [ Reverse Proxy & TLS Gateway ]
       - TLS 1.3 Termination, HSTS (Strict-Transport-Security)
       - Helmet Security Headers (Anti-Sniffing, Frameguard, Referrer-Policy)
       - Cross-Origin Resource Sharing (CORS) with origin validation
                      │
                      ▼
       [ Rate Limiting & Abuse Guard ]
       - Login Rate Limiter (20 attempts / 15 min window)
       - AI Operations Assistant Limiter (60 queries / min)
       - Burst connection protection
                      │
                      ▼
       [ Authentication & Session Vault ]
       - Argon2id Cryptographic Password Hashing ($argon2id$ v=19)
       - Dual-Token Architecture: Short-lived Access Token (15m) + Long-lived Refresh Token (7d)
       - Refresh tokens stored as SHA-256 hashes with cryptographic rotation
       - Client tokens held in memory; refresh delivered via HttpOnly, Secure, SameSite cookies
                      │
                      ▼
       [ Role-Based Access Control (RBAC) & Station Isolation ]
       - Server-side verified role enforcement: ADMIN, OPERATOR, VIEWER
       - Strict station boundary checks (MAITRI vs BHARATI)
                      │
                      ▼
       [ Input Validation & Injection Shields ]
       - Comprehensive Zod validation on parameters, query strings, and payloads
       - SQL Injection immunity via Prisma ORM parameterized queries
       - CSV Formula Injection (CWE-1236) sanitization
       - Stored XSS / HTML Injection (CWE-79) entity escaping
                      │
                      ▼
       [ AI Operations Assistant Safety Guard ]
       - Adversarial prompt-injection detection & refusal
       - Zero autonomous hardware actuation: write mutations require explicit user confirmation
       - Tool Registry with strict role & station permission boundaries
                      │
                      ▼
       [ Audited Storage & Structured Redaction ]
       - PostgreSQL with ACID transactions and concurrency safeguards
       - Structured logging with automatic credential & token redaction
```

---

## 2. Authentication & Session Security

### 2.1 Password Hashing (Argon2id)
- **Algorithm**: Argon2id (`v=19`, memory 65536 KiB, iterations 3, parallelism 4).
- **Salt**: Cryptographically random per-password salt generated automatically.
- **Verification**: Constant-time verification prevents side-channel timing attacks.
- Plaintext passwords and reversible hashes are prohibited across the entire codebase.

### 2.2 JWT & Token Security
- **Access Tokens**: Short-lived (15 minutes), signed using HMAC-SHA256 with strong secrets loaded from environment variables (`JWT_ACCESS_SECRET`).
- **Client Storage**: Stored exclusively in application memory (never in `localStorage` or `sessionStorage`).
- **Refresh Tokens**: Long-lived (7 days), delivered via `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, `Secure` (in production) cookies.
- **Database Hashing**: The raw refresh token is **never stored**. Only its cryptographic SHA-256 hash is persisted in the database.
- **Token Rotation**: Every refresh rotation revokes the old session and generates a fresh token with a unique cryptographic nonce (`jti`). Reusing an expired or revoked refresh token triggers immediate session termination.

### 2.3 Account Lifecycle & Deactivation
- Deactivated accounts (`isActive: false`) are immediately blocked by the `authenticate` middleware and WebSocket handshake.
- Deactivating an account revokes all active refresh token sessions in PostgreSQL (`sessionService.revokeAllUserSessions`).
- Demoting or deactivating the last active `ADMIN` is prevented by database-level counting safeguards.

---

## 3. Role-Based Access Control (RBAC)

POLARIS defines three hierarchical operational roles:

| Role | Operational Scope | Allowed Capabilities | Restricted Capabilities |
|------|-------------------|----------------------|-------------------------|
| **ADMIN** | System Administrator / NCPOR Headquarters | User management, role changes, station configuration, full telemetry, all mutations | Cannot demote last active admin |
| **OPERATOR** | Station Expedition Member / Engineer | Telemetry monitoring, maintenance work order creation, stock intake/consumption, inter-station transfers, alert lifecycle management | User provisioning, role demotion, database administration |
| **VIEWER** | Visiting Scientist / Mission Observer | Read-only telemetry, digital twin inspection, overview dashboards, report generation & export | All POST/PATCH/DELETE mutations, work order dispatch, stock adjustments |

### Server-Side Enforcement Invariant
Client-supplied roles in headers or bodies are never trusted. All permissions are derived directly from the authenticated JWT access token and re-verified against live PostgreSQL account status.

---

## 4. Station Isolation & Multi-Station Partitioning

POLARIS governs two distinct Indian Antarctic Research Stations:
- **Maitri** (70°45′58″S, 11°44′02″E, Schirmacher Oasis)
- **Bharati** (69°24′29″S, 76°11′14″E, Larsemann Hills)

### Isolation Guarantees:
1. **Database Partitioning**: All telemetry (`station_telemetry`, `energy_readings`, `environmental_readings`), equipment, alerts, incidents, inventory items, and work orders are bound to a foreign key `stationId`.
2. **Station Scope Checking**: Operators pinned to a specific station cannot query or modify another station's telemetry or inventory through the API or Assistant.
3. **Cross-Station Transfer Integrity**: Inter-station transfers (`/api/v1/inventory/transfer`) execute inside a single ACID transaction that simultaneously decrements source stock and increments destination stock with matching ledger entries.

---

## 5. API Security & Input Validation

### 5.1 Zod Schema Validation
Every endpoint under `/api/v1/*` executes declarative Zod validation prior to controller dispatch:
- **Pagination Constraints**: Limit strictly bounded between 1 and 100 items; page must be positive.
- **Date Window Sanity**: Start date cannot succeed end date (`from <= to`).
- **Enumeration Whitelisting**: Statuses, severities, categories, and report types are validated against strict TypeScript enums.
- **Body Size Caps**: Express payload limits restricted to 10MB to prevent memory exhaustion attacks.

### 5.2 Error Response Safety
In production (`NODE_ENV === "production"`):
- Stack traces are omitted from all HTTP responses.
- Internal SQL exceptions, Prisma query ASTs, and file paths are never exposed to clients.
- Errors conform to a unified envelope: `{ success: false, error: { code: string, message: string } }`.

---

## 6. Injection Defense & Data Sanitization

### 6.1 SQL Injection
- 100% of database access is mediated through Prisma ORM using parameterized queries.
- Raw SQL query concatenation is strictly forbidden.

### 6.2 CSV Formula Injection (CWE-1236)
- Spreadsheet processors (Excel, LibreOffice, Google Sheets) interpret cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` as executable formulas.
- In `ReportService.exportToCsv`, every dynamic cell, title, summary, and note is sanitized via `sanitizeCsvCell`:
  ```ts
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  ```
  Prepending a single tick disables formula execution across all spreadsheet software.

### 6.3 HTML Injection & Stored XSS (CWE-79)
- In `ReportService.exportToHtml`, all user-controlled text, titles, KPI units, table names, and notes are sanitized through `escapeHtml`:
  ```ts
  String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  ```
  Malicious `<script>`, `<img>`, or `<iframe>` tags render as harmless text literals.

---

## 7. WebSocket Monitoring Security

Real-time telemetry and alarms are served over WebSocket endpoints (`/ws` and `/api/v1/realtime/ws`).

- **Handshake Authentication**: Clients must present a valid JWT access token via `Sec-WebSocket-Protocol: ['polaris-auth', '<token>']` or query parameter `?token=<jwt>`. Handshakes without tokens or with expired tokens are rejected with HTTP 401.
- **Origin Validation**: Production WebSocket handshakes validate the `Origin` header against `CORS_ORIGIN` and allowlisted deployment domains (`*.vercel.app`).
- **Heartbeat & Zombie Pruning**: WebSocket connections send ping/pong heartbeats every 30 seconds. Dead connections are terminated after 65 seconds of silence.
- **Subscription Scoping**: Telemetry broadcasts are partitioned by `stationId` to prevent cross-station telemetry leakage.

---

## 8. AI Operations Assistant Security & Write Safety

The POLARIS AI Operations Assistant is governed by strict operational guardrails:

```
[ User Query ]
      │
      ▼
[ Prompt Injection Detector ] ──(Triggered)──► [ Security Refusal Notice ]
      │
      ▼ (Clean)
[ Intent & Station Extraction ]
      │
      ▼
[ Station Scope Verification ] ──(Unauthorized)──► [ Access Denied Notice ]
      │
      ▼ (Authorized)
[ Safe Action Guard ] ──(Mutation Requested)──► [ Attach ProposedAction with Confirmation Prompt ]
      │
      ▼ (Read-Only)
[ Allowlisted Tool Execution ]
      │
      ▼
[ Grounded AI Response Generation ]
```

### 8.1 Prompt Injection Shielding
- Regex pattern filters scan for prompt injection, jailbreak attempts, DAN mode invocations, system prompt extraction, and database dropping commands.
- Adversarial prompts trigger `buildSecurityRefusalResponse` which logs a security warning and returns a polite policy refusal without invoking backend tools.

### 8.2 Zero Autonomous Hardware Actuation
- The AI Assistant has **zero authority** to directly mutate equipment, acknowledge alarms, resolve incidents, dispatch work orders, or modify inventory stock.
- Queries requesting operational actions (e.g., "Shut down generator GEN-01", "Create emergency work order") return a structured `ProposedAction` in `PROPOSED_REQUIRES_CONFIRMATION` status with an explicit confirmation notice. Actions must be confirmed manually through authorized module interfaces.

---

## 9. Structured Logging & Secret Redaction

Logging is centralized via `StructuredLogger` in `backend/src/utils/logger.ts`:
- Sensitive fields are automatically replaced with `[REDACTED]` before outputting JSON:
  - `password`, `token`, `jwt`, `secret`, `authorization`, `apiKey`, `cookie`, `credential`, `hash`, `bearer`, `database_url`, `gemini`
- Error stack traces are excluded from log outputs in production environments.
- Critical security events (`LOGIN_FAILED`, `ROLE_CHANGED`, `ACCOUNT_DISABLED`) are permanently recorded in the `authentication_events` PostgreSQL table for audit compliance.

---

## 10. Production Security Checklist

Prior to final production deployment at NCPOR / MoES data centers:

- [x] Configure production `DATABASE_URL` with SSL connection (`sslmode=require`).
- [x] Set unique, high-entropy secrets for `JWT_ACCESS_SECRET` (min 64 chars) and `JWT_REFRESH_SECRET`.
- [x] Restrict `CORS_ORIGIN` to official NCPOR domain names (disallow wildcard `*`).
- [x] Ensure `NODE_ENV=production` is set across all runtime containers.
- [x] Verify reverse proxy terminates TLS 1.3 with modern cipher suites.
- [x] Set up firewall ingress rules restricting database port 5432 to internal backend subnet.
- [x] Verify cookie flags: `HttpOnly=true`, `Secure=true`, `SameSite=Lax`.
- [x] Review rate limiting thresholds for external satellite gateways.
- [x] Verify AI Operations Assistant operates in deterministic offline fallback when satellite link is severed.
- [x] Execute automated Phase 13 security regression test suite (`npm run test:security`).
