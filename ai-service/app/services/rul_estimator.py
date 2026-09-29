from typing import Optional, Tuple
from app.schemas.prediction import FeatureVector, DataQuality, RulEstimate


CRITICAL_HEALTH_THRESHOLD = 40.0  # Threshold at which equipment enters critical failure risk


def estimate_rul(
    health_score: float,
    fv: FeatureVector,
    quality: DataQuality
) -> Tuple[Optional[float], Optional[float], RulEstimate]:
    """
    Estimates Remaining Useful Life (RUL) in hours and days to reach critical threshold (health <= 40%).
    Only estimates RUL if measurable negative health trend slope exists and data quality is GOOD.
    Otherwise safely returns None with explicit explanation to avoid fabrication.
    """
    if quality != DataQuality.GOOD:
        return None, None, RulEstimate(
            hours=None,
            days=None,
            minDays=None,
            maxDays=None,
            confidence=0.0,
            status="UNAVAILABLE",
            reason="Insufficient historical degradation data — RUL estimate withheld to avoid fabrication."
        )

    # If equipment is already below critical threshold
    if health_score <= CRITICAL_HEALTH_THRESHOLD:
        return 0.0, 0.0, RulEstimate(
            hours=0.0,
            days=0.0,
            minDays=0.0,
            maxDays=1.0,
            confidence=95.0,
            status="CRITICAL",
            reason="Equipment health is currently at or below critical threshold (<= 40%). Immediate overhaul required."
        )

    slope = fv.healthTrendSlope

    # Check if there is a measurable downward degradation trend
    if slope is None or slope >= -0.05:
        return None, None, RulEstimate(
            hours=None,
            days=None,
            minDays=None,
            maxDays=None,
            confidence=85.0,
            status="STABLE",
            reason="Stable baseline operation — health degradation slope is near zero. Critical threshold projection not applicable."
        )

    # Degradation rate is negative (i.e. health decreasing by abs(slope) % per day)
    degradation_rate_per_day = abs(slope)
    health_margin = health_score - CRITICAL_HEALTH_THRESHOLD
    projected_days = health_margin / degradation_rate_per_day

    # Confidence intervals accounting for telemetry variance
    min_days = max(1.0, projected_days * 0.75)
    max_days = projected_days * 1.35
    rul_days = round(projected_days, 1)
    rul_hours = round(rul_days * 24.0, 1)
    confidence = max(55.0, min(90.0, 90.0 - (projected_days * 0.5)))

    return rul_hours, rul_days, RulEstimate(
        hours=rul_hours,
        days=rul_days,
        minDays=round(min_days, 1),
        maxDays=round(max_days, 1),
        confidence=round(confidence, 1),
        status="ESTIMATED",
        reason=f"Linear degradation extrapolation based on {degradation_rate_per_day:.2f}% daily health decline towards {CRITICAL_HEALTH_THRESHOLD}% threshold."
    )
