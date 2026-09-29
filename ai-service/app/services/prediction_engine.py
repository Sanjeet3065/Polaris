from datetime import datetime, timezone, timedelta
from app.schemas.prediction import PredictionRequest, PredictionResponse, DataQuality
from app.services.data_quality import evaluate_data_quality
from app.services.health_scoring import calculate_health_score
from app.services.risk_assessment import calculate_risk_score
from app.services.rul_estimator import estimate_rul
from app.services.explainability import extract_top_contributing_factors
from app.services.recommendations import generate_recommendation

PREDICTION_HORIZON = "14d"
STALENESS_MINUTES = 30  # Predictions valid for 30 minutes before considered stale


def predict_maintenance(request: PredictionRequest) -> PredictionResponse:
    """
    Executes the end-to-end predictive maintenance pipeline:
    1. Data Quality Evaluation
    2. Health Scoring
    3. Risk Assessment
    4. RUL Estimation
    5. Explainability (Top Contributing Factors)
    6. Actionable Recommendation Generation
    """
    fv = request.featureVector
    now = datetime.now(timezone.utc)

    # 1. Data Quality
    quality = evaluate_data_quality(fv)

    # 2. Health Score & Band
    health_score, health_band = calculate_health_score(fv, quality)

    # 3. Risk Score & Band
    risk_score, risk_band = calculate_risk_score(health_score, fv, quality)

    # 4. RUL Estimation
    rul_hours, rul_days, rul_details = estimate_rul(health_score, fv, quality)

    # 5. Explainability
    top_factors = extract_top_contributing_factors(fv, health_score, quality)

    # 6. Recommendation
    recommendation = generate_recommendation(risk_band, request.equipmentCategory, top_factors)

    # 7. Confidence derivation (depends on data quality & signal availability)
    if quality == DataQuality.GOOD:
        confidence = 88.0
        if fv.tempStd7d is not None and fv.tempStd7d > 5.0:
            confidence -= 8.0  # Telemetry volatility reduces confidence slightly
    elif quality == DataQuality.LIMITED:
        confidence = 62.0
    else:
        confidence = 30.0

    # 8. Telemetry snapshot for transparency
    snapshot = {
        "temperature": fv.currentTemperature,
        "vibration": fv.currentVibration,
        "runtimeHours": fv.currentRuntimeHours,
        "alertsLast7d": fv.alertCount7d,
        "criticalAlerts7d": fv.criticalAlertCount7d,
        "incidentsLast30d": fv.incidentCount30d,
        "daysSinceService": fv.daysSinceLastMaintenance
    }

    return PredictionResponse(
        equipmentId=request.equipmentId,
        stationId=request.stationId,
        healthScore=health_score,
        healthBand=health_band,
        riskScore=risk_score,
        riskBand=risk_band,
        estimatedRulHours=rul_hours,
        estimatedRulDays=rul_days,
        rulDetails=rul_details,
        confidence=round(confidence, 1),
        dataQuality=quality,
        predictionHorizon=PREDICTION_HORIZON,
        topFactors=top_factors,
        recommendation=recommendation,
        modelName="polaris-degradation-baseline-v1",
        modelVersion="1.0.0",
        featureVersion="1.0",
        telemetrySnapshot=snapshot,
        generatedAt=now,
        expiresAt=now + timedelta(minutes=STALENESS_MINUTES)
    )
