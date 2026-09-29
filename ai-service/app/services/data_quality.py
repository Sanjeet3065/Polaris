from app.schemas.prediction import FeatureVector, DataQuality


def evaluate_data_quality(fv: FeatureVector) -> DataQuality:
    """
    Evaluates telemetry data quality based on presence of essential readings,
    plausibility, and temporal history.
    """
    # Essential primary signals
    has_temp = fv.currentTemperature is not None
    has_vib = fv.currentVibration is not None
    has_health = fv.currentHealthPercent is not None

    # Check for completely missing readings
    if not has_health and not has_temp and not has_vib:
        return DataQuality.INSUFFICIENT

    # Physical plausibility check (e.g. impossible temperatures or negative vibrations)
    if fv.currentTemperature is not None and (fv.currentTemperature < -100.0 or fv.currentTemperature > 300.0):
        return DataQuality.INSUFFICIENT
    if fv.currentVibration is not None and (fv.currentVibration < 0.0 or fv.currentVibration > 100.0):
        return DataQuality.INSUFFICIENT

    # Rolling window presence check
    has_rolling = fv.tempMean7d is not None or fv.vibrationMean7d is not None or fv.healthTrendSlope is not None

    if has_health and (has_temp or has_vib) and has_rolling:
        return DataQuality.GOOD

    if has_health or has_temp or has_vib:
        return DataQuality.LIMITED

    return DataQuality.INSUFFICIENT
