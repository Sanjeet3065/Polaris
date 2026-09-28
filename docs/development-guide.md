# POLARIS Developer Onboarding & Contribution Guide

## 1. Prerequisites

Ensure your development environment meets the following baseline requirements:
* **Node.js**: `v20.x` or `v24.x` (LTS recommended)
* **npm**: `v10.x` or `v11.x`
* **Python**: `3.11.x` to `3.14.x` (for `ai-service`)
* **Docker & Docker Compose**: (Optional for local development, recommended for full stack container testing)
* **Git**: `2.40+`

---

## 2. Quickstart — Local Development

### 1. Clone & Setup Environment Variables
```bash
git clone <repository_url> polaris
cd polaris

# Copy environment configuration template
cp .env.example .env
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Launch Services
You can run services concurrently from the root directory or launch them independently:

```bash
# Option A: Run Backend + Frontend concurrently from root
npm run dev

# Option B: Run specific services
npm run dev:backend   # Starts Express API on http://localhost:5000
npm run dev:frontend  # Starts Vite React UI on http://localhost:5173
npm run dev:ai        # Starts FastAPI AI engine on http://localhost:8000
```

Windows developers can also double-click `scripts/dev.bat`.

---

## 3. Microservice Ports & Endpoints

| Service | Local URL | Health Check Endpoint |
| :--- | :--- | :--- |
| **Frontend Application** | `http://localhost:5173` | Home Landing & Station Switcher |
| **Backend API Gateway** | `http://localhost:5000` | `http://localhost:5000/api/v1/health` |
| **AI Inference Engine** | `http://localhost:8000` | `http://localhost:8000/health` |
| **PostgreSQL Database** | `localhost:5432` | Standard PostgreSQL Port |

---

## 4. Docker Deployment

To launch the entire platform stack in isolated production-grade containers:

```bash
# Build and start all services in detached mode
docker-compose up -d --build

# View real-time logs
docker-compose logs -f

# Shut down containers and preserve database volume
docker-compose down
```

---

## 5. Code Quality & Verification Commands

Before submitting pull requests or committing code, ensure all static analysis and type checks pass:

```bash
# TypeScript strict typechecks
npm --prefix backend run typecheck
npm --prefix frontend run typecheck

# Production asset builds
npm --prefix backend run build
npm --prefix frontend run build
```

---

## 6. Monorepo Directory Layout

```
POLARIS/
├── frontend/         # React 18 + Vite + Three.js + Tailwind CSS
├── backend/          # Node.js + Express + TypeScript + Zod
├── ai-service/       # Python + FastAPI + Scikit-Learn
├── simulator/        # Synthetic Antarctic telemetry engine specification
├── database/         # PostgreSQL schema blueprints & migration guides
├── docs/             # Comprehensive system architecture & ADRs
├── docker/           # Production multi-stage Dockerfiles
├── scripts/          # Automation and development launch scripts
├── .github/          # CI/CD GitHub Actions workflows
├── .env.example      # Environment variables template
├── docker-compose.yml# Production container orchestration
└── package.json      # Monorepo workspaces orchestration
```
