from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    FeatureVector,
    DataQuality
)
from app.services.prediction_engine import predict_maintenance
from app.services.data_quality import evaluate_data_quality

router = APIRouter(prefix="", tags=["Predictive Maintenance"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict Equipment Maintenance Risk and Health Index",
    status_code=status.HTTP_200_OK
)
def predict(request: PredictionRequest) -> PredictionResponse:
    """
    Evaluates equipment diagnostics and telemetry features to produce an explainable
    health score, risk band, estimated RUL, and operational recommendation.
    """
    try:
        return predict_maintenance(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during predictive maintenance evaluation: {str(exc)}"
        )


@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch Predict Maintenance for Multiple Assets",
    status_code=status.HTTP_200_OK
)
def predict_batch(request: BatchPredictionRequest) -> BatchPredictionResponse:
    """
    Batch evaluation of multiple equipment items across Maitri and Bharati stations.
    """
    predictions = []
    for item in request.items:
        try:
            pred = predict_maintenance(item)
            predictions.append(pred)
        except Exception:
            # Continue with other items for resilience
            continue

    return BatchPredictionResponse(
        totalCount=len(predictions),
        predictions=predictions
    )


@router.post(
    "/validate-features",
    summary="Validate Telemetry Feature Vector",
    status_code=status.HTTP_200_OK
)
def validate_features(fv: FeatureVector):
    """
    Validates a feature vector and returns data quality classification and field-level warnings.
    """
    quality = evaluate_data_quality(fv)
    warnings = []

    if fv.currentTemperature is None:
        warnings.append("Missing operating temperature reading.")
    if fv.currentVibration is None:
        warnings.append("Missing mechanical vibration reading.")
    if fv.healthTrendSlope is None:
        warnings.append("Missing rolling health trend slope. RUL estimation will be withheld.")
    if fv.daysSinceLastMaintenance is None:
        warnings.append("Missing last maintenance service interval.")

    return {
        "dataQuality": quality,
        "isSufficientForRul": quality == DataQuality.GOOD and fv.healthTrendSlope is not None and fv.healthTrendSlope < -0.05,
        "warnings": warnings
    }
