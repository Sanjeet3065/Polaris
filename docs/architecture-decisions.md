# POLARIS Architecture Decision Records (ADR)

## ADR-001: Monorepo vs. Multi-Repo Architecture
* **Status**: Accepted
* **Context**: SIH 2026 demands rapid prototyping, unified versioning, and synchronized changes between Frontend (Dashboard + 3D Twin), Backend (API + WebSockets), and AI Service.
* **Decision**: Adopt a lightweight **npm workspaces monorepo** with distinct `/frontend`, `/backend`, `/ai-service`, and `/simulator` folders.
* **Consequences**: Single source of truth, simplified Docker Compose orchestration, and shared TypeScript domain interfaces without package registry publishing overhead.

---

## ADR-002: PostgreSQL as Primary Store (Avoiding Early TimescaleDB / InfluxDB Complexity)
* **Status**: Accepted
* **Context**: Sensor telemetry for two stations (Maitri and Bharati) generates ~500 to 1,000 data points per second. Adding specialized time-series databases introduces deployment friction and increased container resource overhead.
* **Decision**: Utilize standard **PostgreSQL 16** with composite B-Tree indexes on `(sensor_id, timestamp DESC)` and declarative monthly range partitioning.
* **Consequences**: Standard PostgreSQL easily handles up to 15,000 writes/second on modern hardware. This avoids premature optimization while preserving full SQL ACID joins across stations, equipment, and incidents.

---

## ADR-003: Dedicated Python FastAPI Service for AI / Machine Learning
* **Status**: Accepted
* **Context**: Machine learning libraries for predictive maintenance and time-series forecasting (Scikit-Learn, Pandas, NumPy, PyTorch) have mature ecosystems in Python. Running ML inside Node.js is inefficient.
* **Decision**: Implement a separate microservice (`ai-service/`) using **FastAPI** communicating with the Node.js backend over an internal REST API network.
* **Consequences**: Clean separation of operational concerns. Data scientists can iterate on models without touching the core web API or frontend logic.

---

## ADR-004: Three.js + React Three Fiber (R3F) for the 3D Digital Twin
* **Status**: Accepted
* **Context**: The hackathon problem statement requires an intuitive 3D representation of station layouts, equipment placement, and thermal conditions.
* **Decision**: Utilize **Three.js** declarative bindings via **@react-three/fiber** and **@react-three/drei** directly embedded in the React component tree.
* **Consequences**: Enables seamless reactive state binding (e.g. clicking a 3D generator selects its telemetry stream in the 2D side drawer). 3D canvas lifecycle is isolated from 2D charts to ensure 60fps rendering performance.

---

## ADR-005: Socket.IO for Live Telemetry Over Plain WebSockets
* **Status**: Accepted
* **Context**: Antarctic communication links experience satellite dropouts, high latency, and intermittent disconnects.
* **Decision**: Use **Socket.IO** rather than bare WebSockets.
* **Consequences**: Provides battle-tested automatic reconnection backoff, room-based subscription channels (`station:bharati`), and graceful HTTP long-polling fallback.

---

## ADR-006: Zod for Request Validation
* **Status**: Accepted
* **Context**: Ingesting simulated and user-submitted inputs requires strict runtime type validation to protect database integrity.
* **Decision**: Use **Zod** across the backend to validate all request bodies, query parameters, and environment variables.
* **Consequences**: Eliminates boilerplate validation code, provides typed DTOs derived directly from schemas, and produces standard user-friendly error messages.
