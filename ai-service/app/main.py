from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.health import HealthResponse

app = FastAPI(
    title="POLARIS AI Inference & Prediction Service",
    description="Predictive maintenance, energy demand forecasting, and operational anomaly detection for Antarctic Research Stations",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    tags=["Health"]
)
def get_health() -> HealthResponse:
    return HealthResponse(
        service="polaris-ai",
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0"
    )

@app.get(
    "/",
    tags=["Root"]
)
def root():
    return {
        "service": "polaris-ai",
        "description": "POLARIS AI Engine Foundation (Phase 0)",
        "capabilities": [
            "Equipment Remaining Useful Life (RUL) Prediction",
            "Energy Consumption & Demand Forecasting",
            "Battery Depletion Curve Modeling",
            "Fuel Tank Depletion & Replenishment Optimization",
            "Antarctic Weather Anomaly Detection"
        ],
        "healthEndpoint": "/health",
        "docs": "/docs"
    }
