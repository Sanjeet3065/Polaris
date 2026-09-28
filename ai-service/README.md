# POLARIS AI Service — Predictive Maintenance & Telemetry Intelligence

The **POLARIS AI Service** is a dedicated Python microservice built with **FastAPI**, designed to provide predictive analytics, failure risk assessment, and operational forecasting for India's Antarctic research stations (**Maitri** and **Bharati**).

## Architecture & Responsibilities

In polar environments, equipment failure can be catastrophic. The AI service provides machine learning models tailored to high-reliability station operations:

```
Telemetry Stream / Historical Data (PostgreSQL)
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│               POLARIS AI Service (FastAPI)             │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │ Predictive Maintenance│  │ Energy Forecasting    │  │
│  │ - Remaining Useful    │  │ - Solar & Wind Output │  │
│  │   Life (RUL)          │  │ - Diesel Consumption  │  │
│  │ - Vibration Anomalies │  │ - Battery Depletion   │  │
│  └───────────────────────┘  └───────────────────────┘  │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │ Fuel Optimization     │  │ Environmental Alerting│  │
│  │ - Replenishment Cycles│  │ - Blizzard Detection  │  │
│  │ - Resupply Horizons   │  │ - Freeze Risks        │  │
│  └───────────────────────┘  └───────────────────────┘  │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
Node.js API Backend ──> React Dashboard & 3D Digital Twin
```

## Future Capabilities (Phase 10 & Phase 12)

1. **Equipment Health & Remaining Useful Life (RUL)**:
   - Weibull hazard rate modeling and multivariate regression on generator vibration, temperature, and bearing stress.
2. **Energy Demand & Generation Forecasting**:
   - Short-term (24h) and medium-term (7d) power load forecasting under variable Katabatic wind speeds and polar day/night solar variations.
3. **Battery Depletion Prediction**:
   - Non-linear state-of-charge (SoC) decay models accounting for sub-zero battery storage thermal degradation.
4. **Fuel Tank Optimization**:
   - Consumption forecasting linked to weather severity and heating requirements to project "Days of Fuel Autonomy Remaining."
5. **Operational Assistant Engine**:
   - Natural language operational insights correlating telemetry anomalies with standard operating procedures (SOPs).

## Directory Structure

```
ai-service/
├── app/
│   ├── api/          # Route handlers and FastAPI endpoints
│   ├── models/       # ML model definitions (Scikit-Learn/PyTorch artifacts)
│   ├── schemas/      # Pydantic schemas for request/response validation
│   ├── services/     # Inference pipelines & analytical business logic
│   ├── utils/        # Feature transformers and math helpers
│   └── main.py       # FastAPI application factory & health check
├── tests/            # Unit & model accuracy tests
├── requirements.txt  # Python package specifications
└── README.md         # Service documentation
```

## Running the Service (Development)

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```

## Health Check Endpoint

```http
GET /health
Host: localhost:8000
```

**Response (`200 OK`):**
```json
{
  "service": "polaris-ai",
  "status": "healthy",
  "timestamp": "2026-09-28T16:58:00.000000Z",
  "version": "0.1.0"
}
```
