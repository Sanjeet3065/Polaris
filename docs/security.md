# POLARIS Security, Compliance & Governance Framework

## 1. Security Architecture Overview

Operating remote Antarctic stations over public satellite internet requires a strict **Defense-in-Depth** and **Zero-Trust** security architecture. Remote physical commands (such as tripping circuit breakers, overriding HVAC dampers, or modifying fuel valve positions) carry life-critical consequences.

```
       Internet / Satellite Ingress
                    │
                    ▼
     [ Cloudflare / Reverse Proxy ]
     (DDoS Mitigation, TLS 1.3 Termination)
                    │
                    ▼
     [ Express Gateway Hardening ]
     - Helmet Security Headers (CSP, HSTS)
     - CORS Origin Whitelisting
     - express-rate-limit (100 req/min per IP)
                    │
                    ▼
     [ Authentication & RBAC Gate ]
     - JWT Signature Verification
     - Refresh Token Fingerprinting
     - Granular Station Scopes
                    │
                    ▼
     [ Strict Input Sanitization ]
     - Zod Schema Validation
     - SQL Injection Immunity via Prisma ORM
                    │
                    ▼
     [ Immutable Audit Log Vault ]
     (Hash-chained command audit trails)
```

---

## 2. Role-Based Access Control (RBAC) Matrix

| Permission Scope | SUPER_ADMIN | STATION_ADMIN | OPERATOR | SCIENTIST | LOGISTICS_MANAGER | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **View Telemetry & 3D Twin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Acknowledge Alarms** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Trigger Remote Overrides** | ✅ | ✅ (Own Station) | ✅ (Limited) | ❌ | ❌ | ❌ |
| **Manage Inventory & Cargo** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **View Environmental Data** | ✅ | ✅ | ✅ | ✅ (Full Export) | ✅ | ✅ |
| **Create Maintenance Orders**| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **User & Key Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Security Audit Logs** | ✅ | ✅ (Read) | ❌ | ❌ | ❌ | ❌ |

---

## 3. Threat Prevention & Implementation Principles

1. **Token Security & Session Management**:
   - Access tokens are short-lived (15 minutes), signed with asymmetric HMAC-SHA256, and kept in memory.
   - Refresh tokens are long-lived (7 days), stored in secure `HttpOnly`, `SameSite=Strict`, `Secure` cookies with automatic rotation and database fingerprint invalidation on reuse detection.
2. **Input Validation with Zod**:
   - Every route parameter, query string, and JSON body is validated against a strict Zod schema before hitting controllers.
   - Unexpected fields are stripped (`strip()` mode) to prevent mass-assignment vulnerabilities.
3. **Sensitive Data Redaction & Logging**:
   - All logging is structured and automatically sanitizes keys containing `password`, `token`, `secret`, `jwt`, `key`, or `authorization`.
   - Stack traces are omitted in production responses; internal system errors return generic tracking identifiers.
4. **Audit Logging (Compliance)**:
   - All remote commands (e.g. `MANUAL_GENERATOR_START`, `ISOLATE_BATTERY_STRING`) generate an immutable audit log record capturing:
     `timestamp`, `userId`, `userRole`, `stationCode`, `equipmentId`, `action`, `previousState`, `newState`, `ipAddress`.
