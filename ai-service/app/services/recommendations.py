from typing import List
from app.schemas.prediction import RiskBand, ContributingFactor


def generate_recommendation(
    risk_band: RiskBand,
    equipment_category: str,
    top_factors: List[ContributingFactor]
) -> str:
    """
    Generates a deterministic polar operations maintenance recommendation.
    Advisory only — does not execute destructive or automated actions.
    """
    primary_category = top_factors[0].category if top_factors else "BASELINE"

    if risk_band == RiskBand.CRITICAL:
        if primary_category == "THERMAL":
            return f"PRIORITY CRITICAL: Immediate mechanical inspection required. Check coolant circulation, radiator louvers, and heat exchangers on {equipment_category} within 12 hours."
        elif primary_category == "VIBRATION":
            return f"PRIORITY CRITICAL: Urgent mechanical inspection. Inspect mounting bolts, rotor alignment, and bearing integrity on {equipment_category} to prevent catastrophic seizure."
        elif primary_category == "ALERT":
            return f"PRIORITY CRITICAL: Investigate active high-severity alarms immediately. Coordinate with station engineering to mitigate recurring faults."
        else:
            return f"PRIORITY CRITICAL: Dispatch station engineering team for comprehensive inspection and fault isolation within 24 hours."

    elif risk_band == RiskBand.HIGH:
        if primary_category == "THERMAL":
            return f"Schedule cooling loop inspection and fluid level check within 48 hours to mitigate rising thermal trend."
        elif primary_category == "VIBRATION":
            return f"Schedule vibration spectral analysis and bearing lubrication check during the next maintenance window."
        elif primary_category == "MAINTENANCE":
            return f"Service overdue: Schedule full preventive overhaul and filter replacement within 72 hours."
        else:
            return f"Schedule preventive inspection within 48-72 hours to prevent transition into critical operational risk."

    elif risk_band == RiskBand.MODERATE:
        return f"Schedule routine preventive inspection during the next weekly station engineering round. Monitor telemetry trends."

    elif risk_band == RiskBand.GUARDED:
        return f"Continue telemetry monitoring. Review recent operational logs and verify secondary sensor calibration."

    else:  # LOW
        return f"Nominal operation. Continue standard automated telemetry monitoring and scheduled routine maintenance cycles."
