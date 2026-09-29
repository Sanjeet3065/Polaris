from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.prediction import (
    PredictionRequest,
    FeatureVector,
    DataQuality,
    RiskBand,
    HealthBand
)
from app.services.data_quality import evaluate_data_quality
from app.services.health_scoring import calculate_health_score
from app.services.risk_assessment import calculate_risk_score
from app.services.rul_estimator import estimate_rul
from app.services.explainability import extract_top_contributing_factors
from app.services.recommendations import generate_recommendation
from app.services.prediction_engine import predict_maintenance

client = TestClient(app)


def test_service_health():
    """Verify AI service health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "polaris-ai"
    assert data["status"] == "healthy"


def test_service_root():
    """Verify AI service root capabilities discovery"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "endpoints" in data
    assert data["endpoints"]["predict"] == "/predict"


def test_data_quality_good():
    """Verify GOOD data quality when all rolling signals present"""
    fv = FeatureVector(
        currentTemperature=84.2,
        currentVibration=1.8,
        currentHealthPercent=94.0,
        tempMean7d=83.5,
        vibrationMean7d=1.7,
        healthTrendSlope=-0.1
    )
    quality = evaluate_data_quality(fv)
    assert quality == DataQuality.GOOD


def test_data_quality_limited():
    """Verify LIMITED data quality when only static reading present without rolling window"""
    fv = FeatureVector(
        currentTemperature=85.0,
        currentHealthPercent=90.0
    )
    quality = evaluate_data_quality(fv)
    assert quality == DataQuality.LIMITED


def test_data_quality_insufficient():
    """Verify INSUFFICIENT data quality when readings are empty or physically impossible"""
    fv_empty = FeatureVector()
    assert evaluate_data_quality(fv_empty) == DataQuality.INSUFFICIENT

    fv_impossible = FeatureVector(
        currentTemperature=850.0,  # Physically impossible for station generator
        currentHealthPercent=90.0
    )
    assert evaluate_data_quality(fv_impossible) == DataQuality.INSUFFICIENT


def test_health_scoring_nominal():
    """Verify nominal equipment achieves HEALTHY band (>= 90)"""
    fv = FeatureVector(
        currentTemperature=80.0,
        baselineTemp=80.0,
        currentVibration=1.5,
        baselineVibration=1.5,
        currentHealthPercent=98.0,
        criticalAlertCount7d=0,
        highAlertCount7d=0,
        incidentCount30d=0
    )
    score, band = calculate_health_score(fv, DataQuality.GOOD)
    assert score >= 90.0
    assert band == HealthBand.HEALTHY


def test_health_scoring_thermal_and_vibration_penalties():
    """Verify elevated temperature and vibration degrade health score"""
    fv = FeatureVector(
        currentTemperature=96.0,  # +16°C above baseline
        baselineTemp=80.0,
        currentVibration=3.5,    # +2.0 mm/s above baseline
        baselineVibration=1.5,
        currentHealthPercent=95.0,
        criticalAlertCount7d=1,
        highAlertCount7d=2
    )
    score, band = calculate_health_score(fv, DataQuality.GOOD)
    assert score < 70.0
    assert band in [HealthBand.WATCH, HealthBand.DEGRADED, HealthBand.CRITICAL]


def test_risk_scoring_bands():
    """Verify risk bands properly map from low to critical"""
    # High health -> Low risk
    fv_low = FeatureVector(criticalAlertCount7d=0)
    score_low, band_low = calculate_risk_score(95.0, fv_low, DataQuality.GOOD)
    assert score_low < 20.0
    assert band_low == RiskBand.LOW

    # Low health with critical alert -> Critical risk
    fv_crit = FeatureVector(criticalAlertCount7d=2, healthTrendSlope=-1.2)
    score_crit, band_crit = calculate_risk_score(35.0, fv_crit, DataQuality.GOOD)
    assert score_crit >= 80.0
    assert band_crit == RiskBand.CRITICAL


def test_rul_estimation_active_degradation():
    """Verify linear degradation RUL estimation when trend slope is negative"""
    fv = FeatureVector(
        currentTemperature=88.0,
        currentHealthPercent=75.0,
        healthTrendSlope=-1.5,  # 1.5% drop per day
        tempMean7d=87.0
    )
    hours, days, details = estimate_rul(75.0, fv, DataQuality.GOOD)
    assert days is not None
    # (75 - 40) / 1.5 = 23.3 days
    assert 20.0 <= days <= 26.0
    assert hours == round(days * 24.0, 1)
    assert details.status == "ESTIMATED"
    assert details.minDays is not None and details.maxDays is not None
    assert details.minDays < days < details.maxDays


def test_rul_estimation_stable_operation():
    """Verify RUL returns None/STABLE when equipment is not actively deteriorating"""
    fv = FeatureVector(
        currentHealthPercent=96.0,
        healthTrendSlope=0.0,  # Zero slope
        tempMean7d=80.0
    )
    hours, days, details = estimate_rul(96.0, fv, DataQuality.GOOD)
    assert hours is None
    assert days is None
    assert details.status == "STABLE"


def test_rul_estimation_withheld_on_insufficient_data():
    """Verify RUL is withheld when data quality is insufficient or limited"""
    fv = FeatureVector(
        currentHealthPercent=75.0,
        healthTrendSlope=-1.0
    )
    hours, days, details = estimate_rul(75.0, fv, DataQuality.LIMITED)
    assert hours is None
    assert days is None
    assert details.status == "UNAVAILABLE"


def test_explainability_factors():
    """Verify top contributing factors are identified with ranked weights"""
    fv = FeatureVector(
        currentTemperature=94.5,
        baselineTemp=80.0,
        currentVibration=3.2,
        baselineVibration=1.5,
        criticalAlertCount7d=1,
        daysSinceLastMaintenance=110.0
    )
    factors = extract_top_contributing_factors(fv, 65.0, DataQuality.GOOD)
    assert len(factors) >= 3
    assert factors[0].impact >= factors[1].impact  # Ranked descending

    categories = [f.category for f in factors]
    assert "THERMAL" in categories
    assert "VIBRATION" in categories or "ALERT" in categories


def test_recommendation_generation():
    """Verify recommendations adapt to risk band and affected subsystems"""
    # Critical thermal
    rec_crit = generate_recommendation(RiskBand.CRITICAL, "GENERATOR", [])
    assert "PRIORITY CRITICAL" in rec_crit

    # Low risk
    rec_low = generate_recommendation(RiskBand.LOW, "BATTERY", [])
    assert "Nominal operation" in rec_low


def test_api_predict_endpoint():
    """Verify POST /predict FastAPI endpoint returns full schema"""
    payload = {
        "stationId": "MAITRI",
        "equipmentId": "eq-gen-01",
        "equipmentCode": "MAITRI-GEN-01",
        "equipmentCategory": "GENERATOR",
        "featureVector": {
            "currentTemperature": 88.5,
            "baselineTemp": 80.0,
            "currentVibration": 2.4,
            "baselineVibration": 1.5,
            "currentHealthPercent": 78.0,
            "healthTrendSlope": -0.8,
            "tempMean7d": 87.0,
            "alertCount7d": 3,
            "criticalAlertCount7d": 0,
            "highAlertCount7d": 1,
            "daysSinceLastMaintenance": 45.0
        },
        "modelVersion": "1.0.0"
    }

    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["equipmentId"] == "eq-gen-01"
    assert "healthScore" in data
    assert "riskScore" in data
    assert "riskBand" in data
    assert "rulDetails" in data
    assert len(data["topFactors"]) > 0
    assert "recommendation" in data
    assert data["modelName"] == "polaris-degradation-baseline-v1"


def test_api_batch_predict_endpoint():
    """Verify POST /predict/batch FastAPI endpoint"""
    payload = {
        "stationId": "MAITRI",
        "items": [
            {
                "stationId": "MAITRI",
                "equipmentId": "eq-1",
                "equipmentCode": "MAITRI-GEN-01",
                "equipmentCategory": "GENERATOR",
                "featureVector": {"currentHealthPercent": 95.0}
            },
            {
                "stationId": "MAITRI",
                "equipmentId": "eq-2",
                "equipmentCode": "MAITRI-BAT-MAIN",
                "equipmentCategory": "BATTERY",
                "featureVector": {"currentHealthPercent": 82.0}
            }
        ]
    }
    response = client.post("/predict/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["totalCount"] == 2
    assert len(data["predictions"]) == 2


def test_api_validate_features_endpoint():
    """Verify POST /validate-features endpoint"""
    payload = {
        "currentTemperature": 85.0,
        "currentHealthPercent": 88.0
    }
    response = client.post("/validate-features", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "dataQuality" in data
    assert "warnings" in data
