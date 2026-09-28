# POLARIS Security, Compliance & Governance Framework

## 1. Security Architecture Overview

Operating remote Antarctic research stations (**Maitri** and **Bharati**) over satellite links requires a strict **Defense-in-Depth** and **Zero-Trust** security architecture. Remote telemetry inspection, station alarms, and maintenance workflows carry mission-critical operational responsibilities.

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
     - CORS Origin Whitelisting with Credentials
     - Rate Limiting (100 req/min general, 10 req/15min login)
     - Cookie Parser (HttpOnly refresh cookies)
                    │
                    ▼
     [ Authentication & RBAC Gate ]
     - JWT Signature Verification (HS256)
     - Memory-only Access Token strategy
     - SHA-256 hashed refresh token sessions
     - Centralized RBAC middleware: authenticate & authorize
                    │
                    ▼
     [ Strict Input Sanitization ]
     - Zod Schema Validation
     - SQL Injection Immunity via Prisma ORM
                    │
                    ▼
     [ Immutable Audit Log Vault ]
     (Authentication events and administrative audit logs)
```

---

## 2. Core Security Controls (Phase 3 Implemented)

### 2.1 Password Hashing with Argon2id
- **Algorithm**: Argon2id (`v=19`, memory 65536 KiB, iterations 3, parallelism 4).
- **Salt**: Cryptographically random per-password salt generated automatically.
- **Verification**: Constant-time verification prevents side-channel timing attacks.
- Plaintext passwords and reversible hashes are prohibited across the entire codebase.

### 2.2 JWT & Token Security
- **Access Tokens**: Short-lived (15 minutes), signed using HMAC-SHA256 with strong secrets loaded from environment variables (`JWT_ACCESS_SECRET`).
- **Client Storage**: Stored exclusively in application memory (never in `localStorage` or `sessionStorage`).
- **Refresh Tokens**: Long-lived (7 days), delivered via `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, `Secure` (in production) cookies.
- **Database Hashing**: The raw refresh token is **never stored**. Only its cryptographic SHA-256 hash is persisted in the database.
- **Token Rotation**: Every refresh rotation revokes the old session and generates a fresh token with a unique cryptographic nonce (`jti`).

### 2.3 Authentication Rate Limiting
- A dedicated rate limiter (`loginRateLimiter`) restricts authentication attempts on `POST /api/v1/auth/login` to **10 requests per 15-minute window per IP**.
- Returns generic `429 Too Many Requests` error with polar error envelopment.

### 2.4 Administrative Safety Invariants
- **Last Active Administrator Safeguard**: The system prevents demoting or deactivating the final active `ADMIN` (returns `409 Conflict`).
- **Self-Deactivation Safeguard**: Active administrators cannot deactivate their own active accounts (returns `400 Bad Request`).

### 2.5 Sensitive Data Sanitization & Logging
- Passwords, `passwordHash`, raw JWT tokens, refresh tokens, and Authorization headers are excluded from logs and sanitized out of all API responses.
- Generic error messages (`"Invalid email or password"`) prevent user enumeration attacks during login.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Permission Scope | ADMIN | OPERATOR | VIEWER |
| :--- | :---: | :---: | :---: |
| **View Telemetry & Station Infrastructure** | ✅ | ✅ | ✅ |
| **View Operational Alerts** | ✅ | ✅ | ✅ |
| **Acknowledge Alarms & Triage** | ✅ | ✅ | ❌ |
| **View Logistics Inventory** | ✅ | ✅ | ✅ |
| **Modify Inventory / Supply Requisitions** | ✅ | ✅ | ❌ |
| **View Maintenance Work Orders** | ✅ | ✅ | ✅ |
| **Create / Modify Work Orders** | ✅ | ✅ | ❌ |
| **User & Personnel Administration** | ✅ | ❌ | ❌ |
| **View Security Audit Stream** | ✅ | ❌ | ❌ |

---

## 4. Immutable Security Audit Logging

All authentication and access modifications generate structured audit events stored in the `authentication_events` table:

- `LOGIN_SUCCESS` — Authorized login
- `LOGIN_FAILED` — Authentication failure
- `LOGOUT` — Session termination
- `REFRESH` — Token rotation
- `PASSWORD_CHANGED` — Password updated
- `ROLE_CHANGED` — Role modified by administrator
- `STATUS_CHANGED` — User activated or deactivated

Audit records store `userId`, `eventType`, `success`, `ipAddress`, `userAgent`, and `metadata` (sanitized). No passwords or raw tokens are ever logged.
