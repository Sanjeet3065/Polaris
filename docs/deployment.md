# POLARIS — Production Deployment Guide

**Polar Operations & Logistics Automated Remote Intelligence System**  
**SIH Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations  
**Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)  
**Stations:** Maitri & Bharati  

---

## 1. System Deployment Architecture

POLARIS implements a high-resilience, 4-tier microservice architecture:

```
                            INTERNET / USERS
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       POLARIS FRONTEND (React + Vite)     │
             │   Static Assets served via Vercel / Nginx │
             └─────────────────────┬─────────────────────┘
                                   │
                         HTTPS / REST / WSS (/ws)
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │         POLARIS BACKEND (Node.js)         │
             │     Express REST API + WebSocket Server   │
             └───────────────┬───────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│     PostgreSQL 16 DB      │   │   AI Service (FastAPI)    │
│  Relational + Time-Series │   │   Predictive Maintenance  │
│       Prisma ORM          │   │      Health & Risk        │
└───────────────────────────┘   └───────────────────────────┘
```

---

## 2. Prerequisites

### Production Host Requirements
- **Node.js:** v20.x or v22.x LTS (compatible with Node 24)
- **Python:** v3.11.x or v3.12.x
- **PostgreSQL:** v16.x (with UUID & time-series indexing)
- **Container Runtime:** Docker Engine 24+ & Docker Compose v2+ (if deploying via containers)
- **RAM:** Minimum 2 GB (4 GB recommended for concurrent 3D Digital Twin + AI inference)
- **Disk:** Minimum 10 GB SSD for persistent database volume

---

## 3. Deployment Methods

### Option A: Complete Docker Compose Deployment (Recommended for Local/Dedicated VM)

1. **Clone and Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your cryptographically secure production keys
   ```

2. **Launch All 4 Services**:
   ```bash
   # Build images and start containers in detached mode
   docker compose up -d --build
   ```

3. **Verify Service Health**:
   ```bash
   docker compose ps
   # Expected status: healthy for all 4 containers
   ```

4. **Service Endpoints**:
   - Frontend Application: `http://<host-ip>:5173` (or `80`)
   - Backend API & Probes: `http://<host-ip>:5000/api/v1/health`
   - Real-Time WebSockets: `ws://<host-ip>:5000/ws`
   - AI Microservice: `http://<host-ip>:8000/health`

---

### Option B: Hybrid Cloud Deployment (Vercel Frontend + PaaS/VM Backend)

This is the exact configuration tested and deployed for the live POLARIS SIH demonstration:

#### 1. Database (e.g., Supabase / Neon / AWS RDS PostgreSQL 16)
Run migration deploy and seed from a secure provisioning terminal:
```bash
cd backend
export DATABASE_URL="postgresql://<user>:<password>@<db-host>:5432/polaris_db?schema=public"
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

#### 2. AI Service (e.g., Render / Fly.io / GCP Cloud Run)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

#### 3. Backend (e.g., Render / Railway / AWS ECS / VPS)
Configure environment variables:
- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL=...`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `AI_SERVICE_URL=http://ai-service:8000`
- `CORS_ORIGIN=https://frontend-silk-iota-blp7wlwptm.vercel.app`
- `RUN_MIGRATIONS=true`

Start the server:
```bash
npm --prefix backend run build
npm --prefix backend run start
```

#### 4. Frontend (Vercel Deployment)
Deploy via Vercel CLI or Git push:
```bash
cd frontend
npx vercel --prod
```
Configure Environment Variables in Vercel Dashboard:
- `VITE_API_URL`: `https://your-backend.com/api/v1`
- `VITE_WS_URL`: `wss://your-backend.com/ws`
- `VITE_STATION_DEFAULT`: `BHARATI`

---

## 4. Database Migration & Seeding Strategy

### Migration Deployment (Non-Destructive)
In production, **NEVER** run `prisma db push` or `prisma migrate reset`.
Always use:
```bash
npx prisma migrate deploy
```
This applies pending SQL migrations in `prisma/migrations/` sequentially and guarantees schema integrity without data loss.

### Deterministic Seeding (Idempotent)
To populate baseline stations, initial admin, operator, and viewer credentials, run:
```bash
npx tsx prisma/seed.ts
```
The seed script uses `upsert` on stations and user accounts, making it 100% idempotent and safe to run multiple times.

---

## 5. WebSocket Deployment Considerations

The POLARIS real-time monitoring engine operates over persistent WebSocket connections (`/ws` and `/api/v1/realtime/ws`).

1. **Persistent Connections Required**:
   Serverless platforms (like AWS Lambda or Vercel Serverless Functions) terminate HTTP requests and do NOT support persistent bidirectional WebSockets. The backend must be hosted on a containerized service (Docker, Render, AWS ECS, GCP Cloud Run with WebSockets enabled, or VM).

2. **Origin Validation (POL-SEC-03)**:
   In production (`NODE_ENV=production`), the WebSocket upgrade handler strictly checks the `Origin` header against `CORS_ORIGIN`. Ensure the frontend domain (e.g., `*.vercel.app`) is included in `CORS_ORIGIN`.

3. **Reconnection & Stale Data Recovery**:
   The frontend automatically connects with exponential backoff and tracks message sequence IDs. When the backend or network drops:
   - UI status displays `OFFLINE (STALE DATA)` with timestamp.
   - Upon reconnection, missed sequences are seamlessly synchronized.

---

## 6. Health Checks & Monitoring

| Endpoint | Method | Expected Output | Purpose |
| :--- | :--- | :--- | :--- |
| `/health` | GET | `{"service":"polaris-backend","status":"healthy"}` | Root container probe |
| `/api/v1/health` | GET | Database status UP, latency in ms | Deep application probe |
| `http://ai-service:8000/health` | GET | `{"service":"polaris-ai","status":"healthy"}` | AI service probe |
| `http://frontend:80/health` | GET | `healthy` | Nginx HTTP probe |

---

## 7. Rollback Procedures

### Application Rollback
If a defect is detected in a new release:
1. Re-tag the previous stable Docker image: `docker compose pull polaris_backend:v0.1.0`.
2. On Vercel: Instantly promote the previous deployment via Vercel Dashboard or CLI (`vercel rollback`).

### Database Rollback
If a schema migration must be rolled back:
1. Create a forward migration that inverts the modification: `npx prisma migrate dev --name revert_changes`.
2. Test the revert on a staging database.
3. Deploy the fix via `npx prisma migrate deploy`.
4. Never delete PostgreSQL volumes in production.
