# POLARIS — CI/CD Pipeline & Quality Gates

**Polar Operations & Logistics Automated Remote Intelligence System**  
**SIH Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations  
**Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)  

---

## 1. Continuous Integration Architecture

POLARIS implements a 4-tier automated GitHub Actions workflow (`.github/workflows/ci.yml`) triggered on every push and pull request to `main` and `develop`:

```
                      GIT PUSH / PULL REQUEST
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Backend Gate   │   │  AI Service Gate │   │  Frontend Gate   │
│  • TypeScript    │   │  • Python 3.11   │   │  • TypeScript    │
│  • Prisma Gen    │   │  • FastAPI tests │   │  • Vite Build    │
│  • 286 Tests     │   │  • 16 Pytests    │   │  • Asset Bundles │
└──────────┬───────┘   └─────────┬────────┘   └────────┬─────────┘
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │     Docker Lint Gate     │
                    │  • Compose Syntax Check  │
                    │  • Dockerfile Integrity  │
                    └──────────────────────────┘
```

---

## 2. Quality Gate Verification Details

### Gate 1: Backend Verification (`backend-gate`)
- **Environment:** Ubuntu Latest, Node.js 20 LTS with npm caching.
- **Commands:**
  1. `npm ci`
  2. `npm run typecheck` (Validates all TypeScript interfaces and controllers).
  3. `npm run db:generate` (Generates Prisma Client from `schema.prisma`).
  4. `npm test` (Executes all 286 backend regression tests, including 32 security tests).

### Gate 2: AI Microservice Verification (`ai-service-gate`)
- **Environment:** Ubuntu Latest, Python 3.11 with pip caching.
- **Commands:**
  1. `pip install -r requirements.txt`
  2. `pytest tests -v` (Runs all 16 prediction, RUL, and Weibull degradation tests).

### Gate 3: Frontend Build & Compilation (`frontend-gate`)
- **Environment:** Ubuntu Latest, Node.js 20 LTS.
- **Commands:**
  1. `npm ci`
  2. `npm run typecheck` (Checks strict TypeScript rules across all React components).
  3. `npm run build` (Compiles Rollup manual chunks: `vendor-three`, `vendor-charts`, `vendor-react`).

### Gate 4: Docker Configuration Gate (`docker-lint-gate`)
- **Dependencies:** Runs after gates 1, 2, and 3 succeed.
- **Validation:** Verifies `docker-compose.yml` and `docker-compose.prod.yml` syntax.

---

## 3. Deployment Security & Zero-Leakage Policy

1. **No Hardcoded Secrets**:
   All production credentials must be injected via GitHub Repository Secrets (`Settings > Secrets and variables > Actions`).
2. **Log Redaction**:
   All tests and services implement structured logging redaction. Authentication headers, JWT tokens, and passwords are never echoed to CI stdout/stderr.
3. **Branch Protection Rules**:
   Merging to `main` requires all 4 CI quality gates to report green status.
