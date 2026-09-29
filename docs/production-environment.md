# POLARIS — Production Environment & Secret Configuration Guide

**Polar Operations & Logistics Automated Remote Intelligence System**  
**SIH Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations  
**Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)  

---

## 1. Environment Variable Architecture & Security Boundaries

POLARIS strictly enforces separation between **Server-Side Protected Secrets** and **Public Frontend Configuration**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC FRONTEND (Vite / Browser)             │
│  Prefixed with VITE_* — Bundled into client JS at build time     │
│  ALLOWED: Public API Base URLs, Station Codes, Feature Flags    │
│  FORBIDDEN: Database credentials, JWT keys, AI provider secrets │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                      REST & WSS Handshake
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│               PROTECTED BACKEND (Node.js & Python)              │
│  Stored in server environment — Never exposed to browser        │
│  Contains: DATABASE_URL, JWT_SECRET, Argon2 hashes, AI API Keys │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Environment Variable Dictionary

### Backend Environment Variables (`backend/.env` or Docker backend)

| Variable | Type | Default | Required in Prod? | Description & Security Guidelines |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` | **YES** | Set to `production` to suppress stack traces and enable strict security. |
| `PORT` | Integer | `5000` | Optional | Port on which Express and WebSocket server listen. |
| `HOST` | String | `0.0.0.0` | Optional | Bind address (0.0.0.0 is mandatory for Docker containers). |
| `DATABASE_URL` | String | *Local DB* | **YES** | PostgreSQL 16 connection URL with `schema=public`. Never commit to Git. |
| `JWT_ACCESS_SECRET` | String | *Built-in* | **YES** | High-entropy string (min 32 chars) used to sign short-lived access tokens. |
| `JWT_ACCESS_EXPIRES_IN`| String | `15m` | Optional | Lifetime of access tokens (recommended: 15 minutes). |
| `JWT_REFRESH_SECRET` | String | *Built-in* | **YES** | High-entropy string used for refresh token generation and rotation. |
| `JWT_REFRESH_EXPIRES_IN`| String | `7d` | Optional | Refresh token validity window (recommended: 7 days). |
| `AUTH_COOKIE_SECURE` | Boolean| `false` | **YES** (if HTTPS) | Set to `true` behind HTTPS/SSL to prevent non-TLS cookie transmission. |
| `AUTH_COOKIE_SAME_SITE`| String | `lax` | Optional | SameSite cookie policy (`lax`, `strict`, or `none` for cross-site). |
| `CORS_ORIGIN` | String | `http://localhost:5173` | **YES** | Comma-separated list of allowed frontend origins (e.g., Vercel domain). |
| `AI_SERVICE_URL` | String | `http://localhost:8000` | Optional | Base URL of the Python FastAPI prediction microservice. |
| `AI_PROVIDER` | String | `deterministic` | Optional | `deterministic` (zero-hallucination polar engine) or `gemini`. |
| `AI_API_KEY` | String | *empty* | Conditional | Google Gemini API key if `AI_PROVIDER=gemini`. Never expose to client. |
| `SIMULATOR_ENABLED` | Boolean| `true` | Optional | Controls whether background sensor simulator ticks continuously. |
| `SIMULATOR_INTERVAL_MS`| Integer | `5000` | Optional | Simulator cycle period in milliseconds (minimum 500ms). |
| `WEBSOCKET_ENABLED` | Boolean| `true` | Optional | Master toggle for real-time WebSocket monitoring server. |
| `WEBSOCKET_MAX_CONNECTIONS`| Integer | `100` | Optional | Maximum concurrent WebSocket client connections allowed. |
| `RUN_MIGRATIONS` | Boolean| `true` | Optional | Automatically runs `npx prisma migrate deploy` on container startup. |
| `SEED_ON_STARTUP` | Boolean| `false` | Optional | Runs deterministic database seed on container boot if true. |

---

### AI Service Environment Variables (`ai-service/.env` or Docker ai-service)

| Variable | Type | Default | Required in Prod? | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Integer | `8000` | Optional | Port for uvicorn ASGI server. |
| `HOST` | String | `0.0.0.0` | Optional | Server bind address. |
| `WORKERS` | Integer | `1` | Optional | Number of uvicorn worker processes. |

---

### Frontend Public Environment Variables (`frontend/.env`)

> **CRITICAL SECURITY NOTE**: These variables are bundled directly into the minified production JavaScript code. Under NO circumstances should database connection strings, JWT signing keys, or AI API keys ever be prefixed with `VITE_`.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | `http://localhost:5000/api/v1` | Public URL of the deployed POLARIS REST API. |
| `VITE_WS_URL` | String | `ws://localhost:5000/ws` | Public URL of the deployed POLARIS WebSocket server. |
| `VITE_STATION_DEFAULT` | String | `BHARATI` | Active research station selected on initial load (`BHARATI` or `MAITRI`). |

---

## 3. Cryptographic Secret Generation

To generate cryptographically secure production keys, run the following command in any terminal:

```bash
# Generate 64-character hex key for JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate 64-character hex key for JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate strong database password
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

---

## 4. Default Seeded Credentials (Reference)

For evaluation and demonstration purposes, the following baseline user accounts are created by `prisma/seed.ts`:

- **Lead Station Commander (ADMIN)**:
  - Email: `admin@polaris.local`
  - Password: `Polaris@Admin2026!`
  - Scope: Complete administrative control, user provisioning, security audit events.

- **Operations Lead (OPERATOR)**:
  - Email: `operator@polaris.local`
  - Password: `Polaris@Operator2026!`
  - Scope: Telemetry monitoring, equipment control, alert acknowledgement, work orders.

- **Research Scientist (VIEWER)**:
  - Email: `viewer@polaris.local`
  - Password: `Polaris@Viewer2026!`
  - Scope: Read-only access to charts, 3D Digital Twin, environmental readings, and AI Assistant.
