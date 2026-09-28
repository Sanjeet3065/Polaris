# POLARIS ❄️
### Polar Operations & Logistics Automated Remote Intelligence System

> **"A Digital Twin for Smarter Antarctic Station Management."**

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue?style=for-the-badge&logo=target)](https://sih.gov.in/)
[![Problem ID](https://img.shields.io/badge/Problem%20ID-SIH26060-orange?style=for-the-badge)](https://sih.gov.in/)
[![Ministry](https://img.shields.io/badge/Ministry-MoES%20%2F%20NCPOR-green?style=for-the-badge)](https://ncpor.res.in/)
[![Phase 0](https://img.shields.io/badge/Phase%200-Foundation%20%26%20Architecture-brightgreen?style=for-the-badge)](#phased-development-roadmap)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

---

## 🧭 Hackathon Problem Statement

* **Competition**: SMART INDIA HACKATHON 2026
* **Problem Statement ID**: **SIH26060**
* **Title**: Digital Platform for efficient remote management of Indian Antarctic Research Stations
* **Organization**: Ministry of Earth Sciences (MoES)
* **Department**: National Centre for Polar and Ocean Research (NCPOR)
* **Category**: Software
* **Theme**: Smart Automation

---

## ❄️ Target Research Stations

POLARIS centralizes monitoring and automated intelligence for India's two permanent Antarctic research outposts:

| Station | Location | Coordinates | Commissioned | Primary Focus |
| :--- | :--- | :--- | :---: | :--- |
| **Bharati** | Larsemann Hills, East Antarctica | 69°24′26″ S, 76°11′14″ E | 2012 | Energy-efficient modern base, oceanography, polar biology, satellite telemetry |
| **Maitri** | Schirmacher Oasis, Queen Maud Land | 70°45′58″ S, 11°44′09″ E | 1989 | Inland base, meteorology, atmospheric science, geomagnetism, glaciology |

---

## 🏛️ System Architecture

POLARIS operates as a modular, resilient microservices platform designed to withstand intermittent satellite links while providing high-fidelity digital twin monitoring:

```mermaid
flowchart TD
    subgraph Station_Edge["Antarctic Station Edge / Simulator"]
        Sensors[Physical & Virtual Sensors]
        Sim[Telemetry Simulator Engine]
        Sensors --> EdgeNode[Edge Data Aggregator]
        Sim --> EdgeNode
    end

    subgraph Core_Platform["POLARIS Central Platform"]
        EdgeNode -->|HTTPS / WSS| Backend[Node.js / Express API Gateway]
        Backend -->|Prisma ORM| Postgres[(PostgreSQL Relational + Time-Series)]
        Backend <-->|Real-time Socket.IO| RealTime[WebSocket Event Hub]
        Backend <-->|REST API| AI[Python FastAPI AI Microservice]
        AI --> MLModels[Predictive Maintenance & RUL Models]
    end

    subgraph Presentation_Layer["User Experience & Operations"]
        RealTime --> Dashboard[React Operations Dashboard]
        RealTime --> DigitalTwin[Three.js / R3F 3D Digital Twin]
        Backend --> Dashboard
        Backend --> DigitalTwin
    end
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, TanStack Query, Axios, Recharts |
| **3D Digital Twin** | Three.js, React Three Fiber (R3F), @react-three/drei, WebGL |
| **Backend Gateway** | Node.js, Express, TypeScript, Zod Schema Validation, Helmet, Morgan |
| **Real-Time Stream** | Socket.IO, WebSockets, Channel Rooms, Reconnection Backoff |
| **Database** | PostgreSQL 16, Prisma ORM, B-Tree & BRIN Indexes, Range Partitioning |
| **AI / ML Service** | Python 3.11+, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy |
| **DevOps & Infra** | Docker, Docker Compose, Nginx, GitHub Actions CI |

---

## 📂 Monorepo Structure

```
POLARIS/
├── frontend/               # React 18 + Vite + Three.js + Tailwind CSS
│   ├── src/
│   │   ├── app/            # App root wrappers
│   │   ├── components/     # UI, Layout, Dashboard, Station, 3D Digital Twin
│   │   ├── pages/          # Architecture overview & dashboard pages
│   │   ├── hooks/          # Custom data & WebSocket hooks
│   │   ├── services/       # Typed HTTP API client layer
│   │   ├── types/          # Central domain TypeScript definitions
│   │   └── styles/         # Polar theme design tokens & Tailwind CSS
├── backend/                # Node.js + Express + TypeScript Gateway
│   ├── src/
│   │   ├── config/         # Zod-validated environment config
│   │   ├── controllers/    # Request/response handlers (Health check)
│   │   ├── middleware/     # Helmet, CORS, Error handling, Request logging
│   │   ├── routes/         # REST API v1 routing table
│   │   ├── services/       # Business logic layer
│   │   ├── repositories/   # Base database abstraction layer
│   │   ├── validators/     # Zod input schemas
│   │   ├── websocket/      # Socket.IO event registry & handler blueprint
│   │   └── utils/          # Structured logger, custom ApiError, standard ApiResponse
├── ai-service/             # Python + FastAPI Predictive Intelligence
│   ├── app/
│   │   ├── schemas/        # Pydantic models (Health check)
│   │   └── main.py         # FastAPI application factory
│   └── requirements.txt    # Python dependencies
├── simulator/              # Synthetic Antarctic Telemetry Engine specification
├── database/               # Relational & Time-Series schema design
├── docs/                   # 10 Detailed Architectural Specifications & ADRs
├── docker/                 # Production Dockerfiles (Backend, Frontend, AI)
├── scripts/                # Launch scripts for Windows (.bat) and Unix (.sh)
├── .github/workflows/      # Continuous Integration workflows
├── .env.example            # Environment configuration template
├── docker-compose.yml      # Multi-container orchestration
└── package.json            # Monorepo workspaces orchestration
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* **Node.js**: `v20.x` or `v24.x`
* **npm**: `v10.x` or `v11.x`
* **Python**: `3.11+` (optional for AI service)

### 2. Installation
```bash
# Clone repository
git clone <repo_url> polaris
cd polaris

# Setup environment variables
cp .env.example .env

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Running Development Servers
```bash
# Concurrently start Backend (port 5000) and Frontend (port 5173)
npm run dev

# Or launch independently:
npm run dev:backend   # Express API
npm run dev:frontend  # Vite React App
npm run dev:ai        # FastAPI AI Engine
```

### 4. Running with Docker Compose
```bash
docker-compose up -d --build
```

---

## 📖 Architecture & Design Documentation

Comprehensive specifications located in the `/docs` directory:

1. [System Architecture Overview](file:///docs/architecture.md)
2. [Architecture Decision Records (ADR)](file:///docs/architecture-decisions.md)
3. [Database & Time-Series Design](file:///docs/database-design.md)
4. [REST API Specification](file:///docs/api-design.md)
5. [Real-Time WebSocket Architecture](file:///docs/realtime-architecture.md)
6. [3D Digital Twin Specification](file:///docs/digital-twin.md)
7. [AI & Predictive Maintenance Engine](file:///docs/ai-architecture.md)
8. [Telemetry & Weather Simulator](file:///docs/simulator.md)
9. [Security, RBAC & Governance Framework](file:///docs/security.md)
10. [Developer Onboarding & Setup Guide](file:///docs/development-guide.md)

---

## 🗓️ Phased Development Roadmap

| Phase | Milestone | Scope | Status |
| :---: | :--- | :--- | :---: |
| **0** | **Foundation & Architecture** | Monorepo layout, Docker, typed Express backend, FastAPI skeleton, docs | **COMPLETED** |
| **1** | Frontend UI + Dashboard Foundation | Polar-themed design system, layout shell, station switcher | Pending |
| **2** | Backend + PostgreSQL + Prisma | Relational & time-series database models, migrations | Pending |
| **3** | Authentication + RBAC | JWT access/refresh rotation, station-scoped permissions | Pending |
| **4** | Sensor / IoT Simulator | Antarctic weather generator, electrical grid simulator | Pending |
| **5** | Real-Time WebSocket Monitoring | Socket.IO bi-directional telemetry streaming | Pending |
| **6** | 3D Digital Twin | Interactive Three.js / R3F station twin with entity mapping | Pending |
| **7** | Energy + Environment Monitoring | Power balance charts, Katabatic wind analytics | Pending |
| **8** | Logistics + Inventory | Cargo manifests, fuel autonomy predictor, supply requests | Pending |
| **9** | Alerts + Incident Management | Threshold anomaly alerts, incident resolution workflows | Pending |
| **10**| AI Predictive Maintenance | RUL modeling, generator vibration anomaly detection | Pending |
| **11**| Analytics + Reports | Compliance exports, PDF generation, historical rollups | Pending |
| **12**| AI Operations Assistant | Natural language polar operations diagnostic assistant | Pending |
| **13**| Security + Complete Testing | Rate limiting, penetration defense, Vitest, Playwright | Pending |
| **14**| Final UI/UX Polish | High-contrast polar mode, micro-animations, keyboard nav | Pending |
| **15**| Docker + Deployment | Multi-container cloud manifests, health monitors | Pending |
| **16**| SIH Demo Mode | One-click emergency scenarios (Blizzard, DG Trip, Fuel Crisis) | Pending |

---

*Developed for the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences (MoES) — Smart India Hackathon 2026.*
