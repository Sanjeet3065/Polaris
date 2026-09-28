# POLARIS Authentication & Session Management Architecture

## 1. Executive Summary

Phase 3 introduces a production-grade, zero-trust authentication and session management subsystem designed specifically for **POLARIS** (Polar Operations & Logistics Automated Remote Intelligence System). 

Because POLARIS manages life-critical Antarctic infrastructure across **Maitri** and **Bharati** research stations over intermittent satellite links (VSAT / Inmarsat / Starlink), authentication adheres to strict security, privacy, and defense-in-depth principles.

---

## 2. Cryptographic Architecture

### 2.1 Password Security (Argon2id)
- **Algorithm**: Argon2id (`v=19`, memory cost `65536 KiB`, iterations `3`, parallelism `4`, cryptographic salt).
- **Storage**: Plaintext passwords are never logged, transmitted in responses, or stored in persistent storage. Only the cryptographic Argon2id hash is saved in the `User.passwordHash` column.
- **Verification**: Constant-time verification prevents side-channel timing attacks.
- **Policy**: Minimum 8 characters, maximum 128 characters.

### 2.2 Access Token (JWT)
- **Algorithm**: HMAC-SHA256 (`HS256`).
- **Lifetime**: 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`).
- **Storage Location**: Stored exclusively in client memory (React state / closure variable). Never stored in browser `localStorage` or `sessionStorage` to mitigate Cross-Site Scripting (XSS) credential theft.
- **Payload Claims**:
  ```json
  {
    "sub": "362721f3-16c5-4a84-98d9-a7c5a1ecc292",
    "email": "operator@polaris.local",
    "role": "OPERATOR",
    "type": "access",
    "iat": 1774880000,
    "exp": 1774880900
  }
  ```
- **Prohibited Claims**: Passwords, hashes, raw tokens, or database credentials are never placed in JWT payloads.

### 2.3 Refresh Token & Session Strategy
- **Format**: Signed JWT containing a unique cryptographic nonce (`jti`) and `sessionId`.
- **Lifetime**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`).
- **Storage Location**: Browser `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`, `Secure` (in production) cookie named `polaris_refresh_token`. JavaScript has zero access to this cookie.
- **Database Storage**: The raw refresh token is **never stored** in the database. Only its cryptographic **SHA-256 hash** (`refreshTokenHash`) is stored in the `sessions` table.
- **Token Rotation**: Every call to `POST /api/v1/auth/refresh` immediately revokes the existing session, issues a new refresh token, and hashes it into a newly created session.
- **Revocation Enforcement**: If an expired or revoked session token is presented, authentication is rejected with `401 Unauthorized`.

---

## 3. Request Flow Diagrams

### 3.1 Login Flow
```
User / Client                      Backend Gateway                  PostgreSQL
     │                                    │                              │
     │── POST /api/v1/auth/login ────────▶│                              │
     │   { email, password }              │── Check Rate Limit           │
     │                                    │── Find User by Email ───────▶│
     │                                    │◀── Return User Record ───────│
     │                                    │── Verify Argon2id Hash       │
     │                                    │── Check User.isActive        │
     │                                    │── Sign Access Token (JWT)    │
     │                                    │── Create Session & Hash ────▶│
     │                                    │── Log LOGIN_SUCCESS Event ──▶│
     │◀── Set HttpOnly Cookie (Refresh) ──│                              │
     │◀── 200 OK { accessToken, user } ───│                              │
```

### 3.2 Authenticated Request Flow
```
Client Request                     Express Middleware              Controller / Service
     │                                    │                              │
     │── Authorization: Bearer <token> ──▶│                              │
     │                                    │── authenticate.ts            │
     │                                    │   - Verify JWT HS256         │
     │                                    │   - Check token type=access  │
     │                                    │   - Check user exists/active │
     │                                    │   - Attach req.user          │
     │                                    │── authorize(...roles)        │
     │                                    │   - Check user.role match    │
     │                                    │── Dispatch Controller ──────▶│
     │◀── 200 OK Response ───────────────────────────────────────────────│
```

---

## 4. API Endpoints Catalog

| Method | Path | Auth Required | Allowed Roles | Description |
|:---|:---|:---:|:---:|:---|
| `POST` | `/api/v1/auth/login` | No | Public | Authenticates credentials, sets refresh cookie, returns access token |
| `POST` | `/api/v1/auth/refresh` | Cookie | All | Rotates refresh session, returns fresh access token |
| `POST` | `/api/v1/auth/logout` | No / Opt | All | Revokes session in DB, clears HttpOnly cookie |
| `GET` | `/api/v1/auth/me` | Bearer | All | Returns authenticated user profile |
| `POST` | `/api/v1/auth/change-password` | Bearer | All | Updates password, revokes existing sessions |
| `GET` | `/api/v1/auth/users` | Bearer | `ADMIN` | Lists users with search, role, and pagination filters |
| `GET` | `/api/v1/auth/users/:userId` | Bearer | `ADMIN` | Fetches details of a specific user |
| `POST` | `/api/v1/auth/users` | Bearer | `ADMIN` | Registers a new station user account |
| `PATCH` | `/api/v1/auth/users/:userId` | Bearer | `ADMIN` | Updates user display name or email |
| `PATCH` | `/api/v1/auth/users/:userId/role` | Bearer | `ADMIN` | Changes role classification (with Last-Admin safeguard) |
| `PATCH` | `/api/v1/auth/users/:userId/status`| Bearer | `ADMIN` | Activates/deactivates user (with Self & Last-Admin safeguards)|
| `POST` | `/api/v1/auth/users/:userId/reset-password` | Bearer | `ADMIN` | Administratively sets a temporary password and revokes sessions |
| `GET` | `/api/v1/auth/events` | Bearer | `ADMIN` | Fetches immutable security audit event stream |

---

## 5. Development Credentials (Deterministic Demo Seed)

> [!WARNING]
> These credentials are strictly for local testing, development, and hackathon demonstration environments. Production environments enforce randomized credentials provisioned via environment variables or secret vaults.

| Email | Password | Role | Description |
|:---|:---|:---:|:---|
| `admin@polaris.local` | `Polaris@Admin2026!` | `ADMIN` | Station Director / Full System Access |
| `operator@polaris.local` | `Polaris@Operator2026!` | `OPERATOR` | Station Engineer / Operational Access |
| `viewer@polaris.local` | `Polaris@Viewer2026!` | `VIEWER` | Scientific Researcher / Read-Only Access |

---

## 6. Environment Variables Reference

```bash
# JWT Cryptographic Secrets (Required)
JWT_ACCESS_SECRET="polaris_demo_jwt_access_secret_sih2026_dev_key"
JWT_REFRESH_SECRET="polaris_demo_jwt_refresh_secret_sih2026_dev_key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Cookie Flags
AUTH_COOKIE_SECURE="false" # set to true in production with HTTPS
AUTH_COOKIE_SAME_SITE="lax"

# Seed Admin Credentials
SEED_ADMIN_EMAIL="admin@polaris.local"
SEED_ADMIN_PASSWORD="Polaris@Admin2026!"
```
