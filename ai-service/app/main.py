from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.health import HealthResponse
from app.api.prediction import router as prediction_router

app = FastAPI(
    title="POLARIS AI Inference & Prediction Service",
    description="Predictive maintenance, health scoring, failure risk assessment, and explainable degradation analysis for Antarctic Research Stations (Maitri & Bharati)",
    version="1.0.0",
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

# Mount Predictive Maintenance API router
app.include_router(prediction_router)


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
        version="1.0.0"
    )


@app.get(
    "/",
    tags=["Root"]
)
def root():
    return {
        "service": "polaris-ai",
        "description": "POLARIS AI Engine — Phase 10 Predictive Maintenance",
        "capabilities": [
            "Equipment Health Scoring (0-100)",
            "Predictive Maintenance Risk Assessment (0-100)",
            "Remaining Useful Life (RUL) Linear & Weibull Degradation Extrapolation",
            "Explainable Factor Attribution & Telemetry Deltas",
            "Deterministic Polar Engineering Advisory Recommendations"
        ],
        "endpoints": {
            "predict": "/predict",
            "predictBatch": "/predict/batch",
            "validateFeatures": "/validate-features",
            "health": "/health",
            "docs": "/docs"
        }
    }
