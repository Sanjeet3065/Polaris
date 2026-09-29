from typing import Tuple
from app.schemas.prediction import FeatureVector, RiskBand, DataQuality


def calculate_risk_score(
    health_score: float,
    fv: FeatureVector,
    quality: DataQuality
) -> Tuple[float, RiskBand]:
    """
    Computes an operational predictive maintenance risk score between 0.0 and 100.0.
    Inverts health score and scales with acute risk amplifiers (critical alerts, rapid degradation slope,
    extreme temperature/vibration exceedances).
    """
    if quality == DataQuality.INSUFFICIENT:
        # Conservative risk baseline when insufficient data exists
        return 35.0, RiskBand.GUARDED

    # Base risk derived inversely from health: 100 - health
    base_risk = 100.0 - health_score
    amplifiers = 0.0

    # Amplifier 1: Active Critical/High Alerts (Immediate operational stress)
    if fv.criticalAlertCount7d > 0:
        amplifiers += min(20.0, fv.criticalAlertCount7d * 10.0)
    elif fv.highAlertCount7d > 0:
        amplifiers += min(10.0, fv.highAlertCount7d * 5.0)

    # Amplifier 2: Negative health slope (Accelerating degradation)
    if fv.healthTrendSlope is not None and fv.healthTrendSlope < -0.5:
        amplifiers += min(15.0, abs(fv.healthTrendSlope) * 6.0)

    # Amplifier 3: Approaching Critical Thresholds directly
    if fv.currentTemperature is not None and fv.temperatureThresholdCritical is not None:
        margin = fv.temperatureThresholdCritical - fv.currentTemperature
        if margin < 10.0:
            amplifiers += min(20.0, max(0.0, (10.0 - margin) * 2.0))

    if fv.currentVibration is not None and fv.vibrationThresholdCritical is not None:
        margin_vib = fv.vibrationThresholdCritical - fv.currentVibration
        if margin_vib < 1.0:
            amplifiers += min(15.0, max(0.0, (1.0 - margin_vib) * 15.0))

    risk_score = max(0.0, min(100.0, base_risk + amplifiers))
    risk_score = round(risk_score, 1)

    return risk_score, _classify_risk_band(risk_score)


def _classify_risk_band(score: float) -> RiskBand:
    if score < 20.0:
        return RiskBand.LOW
    elif score < 40.0:
        return RiskBand.GUARDED
    elif score < 60.0:
        return RiskBand.MODERATE
    elif score < 80.0:
        return RiskBand.HIGH
    else:
        return RiskBand.CRITICAL
