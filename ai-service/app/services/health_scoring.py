from typing import Tuple
from app.schemas.prediction import FeatureVector, HealthBand, DataQuality


def calculate_health_score(fv: FeatureVector, quality: DataQuality) -> Tuple[float, HealthBand]:
    """
    Computes an explainable equipment health score between 0.0 and 100.0.
    Combines diagnostic health rating with thermal stress penalties, vibration penalties,
    alert occurrence penalties, incident penalties, and overdue maintenance penalties.
    """
    if quality == DataQuality.INSUFFICIENT:
        # Default fallback when telemetry is missing
        base = fv.currentHealthPercent if fv.currentHealthPercent is not None else 50.0
        score = max(0.0, min(100.0, float(base)))
        return round(score, 1), _classify_health_band(score)

    # 1. Base Score from current reported diagnostic health
    base = fv.currentHealthPercent if fv.currentHealthPercent is not None else 85.0
    penalties = 0.0

    # 2. Thermal Stress Penalty
    if fv.currentTemperature is not None:
        baseline = fv.baselineTemp if fv.baselineTemp is not None else 80.0
        delta_temp = fv.currentTemperature - baseline
        if delta_temp > 5.0:
            # Progressive thermal penalty
            penalties += min(25.0, (delta_temp - 5.0) * 1.5)

    if fv.tempTrendSlope is not None and fv.tempTrendSlope > 0.5:
        # Rising thermal slope penalty
        penalties += min(10.0, fv.tempTrendSlope * 4.0)

    # 3. Vibration Penalty
    if fv.currentVibration is not None:
        base_vib = fv.baselineVibration if fv.baselineVibration is not None else 1.5
        delta_vib = fv.currentVibration - base_vib
        if delta_vib > 0.5:
            penalties += min(20.0, (delta_vib - 0.5) * 6.0)

    if fv.vibrationTrendSlope is not None and fv.vibrationTrendSlope > 0.1:
        penalties += min(10.0, fv.vibrationTrendSlope * 20.0)

    # 4. Phase 9 Operational Alert Penalty
    penalties += min(15.0, fv.criticalAlertCount7d * 10.0)
    penalties += min(10.0, fv.highAlertCount7d * 4.0)
    penalties += min(5.0, fv.alertCount7d * 0.5)

    # 5. Phase 9 Incident Penalty
    penalties += min(15.0, fv.incidentCount30d * 6.0)

    # 6. Maintenance Overdue Penalty
    if fv.daysSinceLastMaintenance is not None and fv.daysSinceLastMaintenance > 90.0:
        penalties += min(10.0, (fv.daysSinceLastMaintenance - 90.0) * 0.1)

    # 7. Compute Final Clamped Health Score
    health_score = max(0.0, min(100.0, base - penalties))
    health_score = round(health_score, 1)

    return health_score, _classify_health_band(health_score)


def _classify_health_band(score: float) -> HealthBand:
    if score >= 90.0:
        return HealthBand.HEALTHY
    elif score >= 75.0:
        return HealthBand.GOOD
    elif score >= 60.0:
        return HealthBand.WATCH
    elif score >= 40.0:
        return HealthBand.DEGRADED
    else:
        return HealthBand.CRITICAL
