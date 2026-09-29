# POLARIS — Docker & Containerization Architecture Guide

**Polar Operations & Logistics Automated Remote Intelligence System**  
**SIH Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations  
**Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)  

---

## 1. Container Architecture Overview

POLARIS provides enterprise-grade containerization for each tier using isolated, multi-stage Docker builds:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        polaris_network (Bridge)                        │
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │  polaris_frontend   │                 │    polaris_backend     │   │
│   │    (Nginx:alpine)   │─── Port 5000 ──▶│     (Node:20-alpine)   │   │
│   │  Port 80 -> 5173    │                 │      REST + /ws        │   │
│   └─────────────────────┘                 └───────────┬────────────┘   │
│                                                       │                │
│                                     ┌─────────────────┴────────────┐   │
│                                     ▼                              ▼   │
│                          ┌────────────────────┐   ┌────────────────┐   │
│                          │  polaris_postgres  │   │ polaris_ai_srv │   │
│                          │ (Postgres 16-alp)  │   │ (Python 3.11)  │   │
│                          │  Port 5432:5432    │   │   Port 8000    │   │
│                          └─────────┬──────────┘   └────────────────┘   │
│                                    │                                   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     ▼
                        ┌────────────────────────┐
                        │  polaris_postgres_data │
                        │  (Named Docker Volume) │
                        └────────────────────────┘
```

---

## 2. Service Definitions

### 1. `postgres` (Relational & Time-Series Store)
- **Base Image:** `postgres:16-alpine`
- **Volume:** `postgres_data:/var/lib/postgresql/data` (persistent across container restarts).
- **Healthcheck:** `pg_isready -U polaris_admin -d polaris_db`
- **Port:** `5432:5432`

### 2. `backend` (Express API & WebSockets)
- **Multi-Stage Build (`docker/Dockerfile.backend`):**
  - *Builder Stage:* Compiles TypeScript to `dist/`, copies `prisma/`, and runs `prisma generate`.
  - *Runner Stage:* Installs production-only dependencies, runs `prisma generate`, copies `dist/`, wraps process with `dumb-init` for graceful signal forwarding.
- **User:** Runs as unprivileged `node` user.
- **Startup Script (`docker/backend-entrypoint.sh`):** Executes `npx prisma migrate deploy` before launching `dist/server.js`.
- **Healthcheck:** `wget --spider http://localhost:5000/api/v1/health`

### 3. `ai-service` (Predictive Maintenance)
- **Image (`docker/Dockerfile.ai`):** `python:3.11-slim`
- **Server:** `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1`
- **User:** Runs as unprivileged `appuser`.
- **Healthcheck:** `curl -f http://localhost:8000/health`

### 4. `frontend` (Static React Application)
- **Multi-Stage Build (`docker/Dockerfile.frontend`):**
  - *Builder Stage:* Accepts build arguments (`VITE_API_URL`, `VITE_WS_URL`), compiles Vite static distribution with Rollup code-splitting.
  - *Runner Stage:* `nginx:alpine` serving static files with SPA fallback (`try_files $uri $uri/ /index.html;`) and gzip compression.
- **Port:** `5173:80` (or `80:80` in production)
- **Healthcheck:** `wget --spider http://localhost:80/health`

---

## 3. Docker Compose Orchestration

### Starting the Stack
```bash
# Build and run all containers in background
docker compose up -d --build

# Follow logs in real-time
docker compose logs -f

# Check container health status
docker compose ps
```

### Stopping the Stack
```bash
# Stop containers while preserving database volume
docker compose down

# Stop containers and remove volumes (DESTRUCTIVE - ONLY FOR CLEAN RE-PROVISIONING)
docker compose down -v
```

---

## 4. Startup Dependency Order & Health Gates

POLARIS guarantees clean startup synchronization using Docker Compose healthcheck conditions:

1. `postgres` starts first and executes readiness probe `pg_isready`.
2. `ai-service` starts in parallel and exposes `/health`.
3. `backend` starts only when `postgres` and `ai-service` report `healthy`. On boot, the entrypoint applies Prisma migrations.
4. `frontend` starts only when `backend` reports `healthy`.

---

## 5. Persistence & Recovery Verification

### Database Volume Survival Test
1. Start stack: `docker compose up -d`
2. Insert or update records via the API / Web UI.
3. Stop and restart the database container:
   ```bash
   docker compose restart postgres
   ```
4. Verify all records, users, and telemetry data remain intact without corruption.
5. Restart the full compose stack:
   ```bash
   docker compose down && docker compose up -d
   ```
   Data in named volume `polaris_postgres_data` persists safely.
