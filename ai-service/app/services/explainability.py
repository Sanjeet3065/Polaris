from typing import List
from app.schemas.prediction import FeatureVector, ContributingFactor, DataQuality


def extract_top_contributing_factors(
    fv: FeatureVector,
    health_score: float,
    quality: DataQuality
) -> List[ContributingFactor]:
    """
    Extracts and ranks the top explainable factors contributing to degradation and risk.
    All factors are derived directly from actual telemetry deltas, trends, alerts, and maintenance intervals.
    """
    factors: List[ContributingFactor] = []

    # 1. Thermal delta from baseline
    if fv.currentTemperature is not None:
        baseline = fv.baselineTemp if fv.baselineTemp is not None else 80.0
        diff = fv.currentTemperature - baseline
        if diff > 3.0:
            impact = min(35.0, diff * 2.5)
            factors.append(ContributingFactor(
                factor=f"Operating temperature elevated (+{diff:.1f}°C above nominal)",
                impact=round(impact, 1),
                category="THERMAL",
                description=f"Current temperature {fv.currentTemperature:.1f}°C exceeds nominal baseline of {baseline:.1f}°C."
            ))

    # 2. Temperature trend slope
    if fv.tempTrendSlope is not None and fv.tempTrendSlope > 0.3:
        impact = min(25.0, fv.tempTrendSlope * 15.0)
        factors.append(ContributingFactor(
            factor=f"Rising thermal gradient (+{fv.tempTrendSlope:.2f}°C/day)",
            impact=round(impact, 1),
            category="THERMAL",
            description=f"Persistent upward temperature drift observed over recent operating cycles."
        ))

    # 3. Vibration delta from baseline
    if fv.currentVibration is not None:
        base_vib = fv.baselineVibration if fv.baselineVibration is not None else 1.5
        vib_diff = fv.currentVibration - base_vib
        if vib_diff > 0.3:
            impact = min(30.0, vib_diff * 12.0)
            factors.append(ContributingFactor(
                factor=f"Mechanical vibration elevated (+{vib_diff:.2f} mm/s RMS)",
                impact=round(impact, 1),
                category="VIBRATION",
                description=f"Vibration level {fv.currentVibration:.2f} mm/s indicates potential mechanical imbalance or bearing wear."
            ))

    # 4. Phase 9 Critical/High Alerts
    if fv.criticalAlertCount7d > 0 or fv.highAlertCount7d > 0:
        count = fv.criticalAlertCount7d + fv.highAlertCount7d
        impact = min(40.0, fv.criticalAlertCount7d * 20.0 + fv.highAlertCount7d * 10.0)
        factors.append(ContributingFactor(
            factor=f"{count} high/critical operational alerts in 7 days",
            impact=round(impact, 1),
            category="ALERT",
            description=f"Subsystem has triggered {fv.criticalAlertCount7d} critical and {fv.highAlertCount7d} high alerts within the past 7 days."
        ))

    # 5. Diagnostic Health Trend
    if fv.healthTrendSlope is not None and fv.healthTrendSlope < -0.2:
        impact = min(30.0, abs(fv.healthTrendSlope) * 12.0)
        factors.append(ContributingFactor(
            factor=f"Diagnostic health declining ({fv.healthTrendSlope:.2f}%/day)",
            impact=round(impact, 1),
            category="AGING",
            description=f"Equipment health rating exhibits consistent downward trend across diagnostic readings."
        ))

    # 6. Maintenance service interval
    if fv.daysSinceLastMaintenance is not None and fv.daysSinceLastMaintenance > 60.0:
        impact = min(20.0, (fv.daysSinceLastMaintenance - 60.0) * 0.2)
        factors.append(ContributingFactor(
            factor=f"Extended runtime since last service ({int(fv.daysSinceLastMaintenance)} days)",
            impact=round(impact, 1),
            category="MAINTENANCE",
            description=f"Equipment has been in continuous polar duty for {int(fv.daysSinceLastMaintenance)} days without scheduled overhaul."
        ))

    # 7. Fallback if nominal
    if not factors:
        factors.append(ContributingFactor(
            factor="All diagnostic telemetry within nominal baseline tolerances",
            impact=0.0,
            category="BASELINE",
            description="Operating parameters, vibration, and thermal telemetry are stable and within standard manufacturer limits."
        ))

    # Sort descending by impact percentage
    factors.sort(key=lambda x: x.impact, reverse=True)
    return factors[:4]
