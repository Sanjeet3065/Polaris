from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class RiskBand(str, Enum):
    LOW = "LOW"
    GUARDED = "GUARDED"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class HealthBand(str, Enum):
    HEALTHY = "HEALTHY"
    GOOD = "GOOD"
    WATCH = "WATCH"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"


class DataQuality(str, Enum):
    GOOD = "GOOD"
    LIMITED = "LIMITED"
    INSUFFICIENT = "INSUFFICIENT"


class FeatureVector(BaseModel):
    # Core Diagnostics
    currentTemperature: Optional[float] = Field(None, description="Current operating temperature in Celsius")
    currentVibration: Optional[float] = Field(None, description="Current vibration index (mm/s RMS)")
    currentRuntimeHours: Optional[float] = Field(None, description="Cumulative runtime hours")
    currentHealthPercent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Latest diagnostic health rating")

    # Rolling Statistical Windows
    tempMean7d: Optional[float] = Field(None, description="7-day rolling mean temperature")
    tempStd7d: Optional[float] = Field(None, description="7-day rolling standard deviation of temperature")
    tempTrendSlope: Optional[float] = Field(None, description="Daily rate of temperature change (°C/day)")
    vibrationMean7d: Optional[float] = Field(None, description="7-day rolling mean vibration")
    vibrationMax7d: Optional[float] = Field(None, description="7-day rolling peak vibration")
    vibrationTrendSlope: Optional[float] = Field(None, description="Daily rate of vibration change (mm/s/day)")
    healthTrendSlope: Optional[float] = Field(None, description="Daily rate of health rating change (%/day)")

    # Operational History & Events
    alertCount7d: int = Field(0, ge=0, description="Total alerts logged in past 7 days")
    criticalAlertCount7d: int = Field(0, ge=0, description="Critical severity alerts logged in past 7 days")
    highAlertCount7d: int = Field(0, ge=0, description="High severity alerts logged in past 7 days")
    incidentCount30d: int = Field(0, ge=0, description="Operational incidents in past 30 days")
    daysSinceLastMaintenance: Optional[float] = Field(None, ge=0.0, description="Days elapsed since last completed maintenance")

    # Baseline & Reference Limits
    baselineTemp: Optional[float] = Field(None, description="Nominal operating temperature baseline")
    baselineVibration: Optional[float] = Field(None, description="Nominal vibration baseline")
    temperatureThresholdCritical: Optional[float] = Field(None, description="Manufacturer thermal limit")
    vibrationThresholdCritical: Optional[float] = Field(None, description="Manufacturer vibration limit")


class PredictionRequest(BaseModel):
    stationId: str = Field(..., description="Station UUID or Code (MAITRI / BHARATI)")
    equipmentId: str = Field(..., description="Equipment database UUID")
    equipmentCode: str = Field(..., description="Equipment identifier code, e.g., MAITRI-GEN-01")
    equipmentCategory: str = Field("GENERATOR", description="Category: GENERATOR, HVAC, BATTERY, WATER_SYSTEM, etc.")
    featureVector: FeatureVector
    featureTimestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    modelVersion: str = Field("1.0.0", description="Requested model version")


class ContributingFactor(BaseModel):
    factor: str
    impact: float = Field(..., ge=0.0, le=100.0, description="Relative impact percentage weight (0-100)")
    category: str = Field(..., description="THERMAL, VIBRATION, ALERT, INCIDENT, MAINTENANCE, AGING")
    description: str


class RulEstimate(BaseModel):
    hours: Optional[float] = None
    days: Optional[float] = None
    minDays: Optional[float] = None
    maxDays: Optional[float] = None
    confidence: float = Field(..., ge=0.0, le=100.0)
    status: str = Field("ESTIMATED", description="ESTIMATED, STABLE, or UNAVAILABLE")
    reason: str


class PredictionResponse(BaseModel):
    equipmentId: str
    stationId: str
    healthScore: float = Field(..., ge=0.0, le=100.0)
    healthBand: HealthBand
    riskScore: float = Field(..., ge=0.0, le=100.0)
    riskBand: RiskBand
    estimatedRulHours: Optional[float] = None
    estimatedRulDays: Optional[float] = None
    rulDetails: RulEstimate
    confidence: float = Field(..., ge=0.0, le=100.0)
    dataQuality: DataQuality
    predictionHorizon: str = "14d"
    topFactors: List[ContributingFactor]
    recommendation: str
    modelName: str = "polaris-degradation-baseline-v1"
    modelVersion: str = "1.0.0"
    featureVersion: str = "1.0"
    telemetrySnapshot: Optional[Dict[str, Any]] = None
    generatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expiresAt: datetime


class BatchPredictionRequest(BaseModel):
    stationId: Optional[str] = None
    items: List[PredictionRequest]


class BatchPredictionResponse(BaseModel):
    totalCount: int
    predictions: List[PredictionResponse]
    generatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
