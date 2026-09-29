import axios from "axios";
import { logger } from "../utils/logger";
import { RiskBand, DataQuality } from "@prisma/client";

export interface ContributingFactorDto {
  factor: string;
  category: "TELEMETRY" | "VIBRATION" | "THERMAL" | "ALERT" | "INCIDENT" | "MAINTENANCE" | "HEALTH_TREND" | "LOAD";
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impactPercent: number;
  description: string;
  metricValue?: number | null;
  metricUnit?: string | null;
}

export interface RulEstimateDto {
  hours?: number | null;
  days?: number | null;
  minDays?: number | null;
  maxDays?: number | null;
  confidence: number;
  status: "ESTIMATED" | "STABLE" | "CRITICAL" | "UNAVAILABLE";
  reason: string;
}

export interface FeatureVectorInput {
  currentTemperature?: number | null;
  baselineTemp?: number | null;
  currentVibration?: number | null;
  baselineVibration?: number | null;
  currentRuntimeHours?: number | null;
  currentHealthPercent?: number | null;
  tempMean7d?: number | null;
  tempMin7d?: number | null;
  tempMax7d?: number | null;
  tempStdDev7d?: number | null;
  vibrationMean7d?: number | null;
  vibrationMax7d?: number | null;
  healthTrendSlope?: number | null;
  tempTrendSlope?: number | null;
  alertCount7d?: number;
  criticalAlertCount7d?: number;
  highAlertCount7d?: number;
  unresolvedAlertDurationHours?: number;
  recurringAlertCount?: number;
  incidentCount30d?: number;
  activeIncidentCount?: number;
  daysSinceLastMaintenance?: number | null;
  maintenanceCount180d?: number;
  powerOutputKw?: number | null;
  ratedCapacityKw?: number | null;
  operatingLoadPercent?: number | null;
  temperatureThresholdCritical?: number | null;
  vibrationThresholdCritical?: number | null;
}

export interface PredictionRequestDto {
  stationId: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentCategory: string;
  featureVector: FeatureVectorInput;
  featureTimestamp?: string;
  modelVersion?: string;
}

export interface PredictionResultDto {
  healthScore: number;
  healthBand: "HEALTHY" | "GOOD" | "WATCH" | "DEGRADED" | "CRITICAL";
  riskScore: number;
  riskBand: RiskBand;
  confidence: number;
  dataQuality: DataQuality;
  dataQualityReason: string;
  rul: RulEstimateDto;
  estimatedRulHours?: number | null;
  estimatedRulDays?: number | null;
  topFactors: ContributingFactorDto[];
  recommendation: string;
  predictionHorizon: string;
  modelName: string;
  modelVersion: string;
  featureVersion: string;
  generatedAt: string;
  expiresAt: string;
  isFallback: boolean;
}

export class AiClientService {
  private static instance: AiClientService;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  private constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    this.timeoutMs = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 3500;
  }

  public static getInstance(): AiClientService {
    if (!AiClientService.instance) {
      AiClientService.instance = new AiClientService();
    }
    return AiClientService.instance;
  }

  /**
   * Primary inference caller with automatic graceful fallback
   */
  public async getPrediction(request: PredictionRequestDto): Promise<PredictionResultDto> {
    try {
      const response = await axios.post<PredictionResultDto>(
        `${this.baseUrl}/predict`,
        request,
        {
          timeout: this.timeoutMs,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      return {
        ...response.data,
        isFallback: false
      };
    } catch (error) {
      logger.warn(
        `AI_SERVICE_UNAVAILABLE: Falling back to deterministic statistical scoring for ${request.equipmentCode} (${(error as Error).message})`
      );
      return this.computeInProcessFallback(request);
    }
  }

  /**
   * Deterministic statistical fallback model if AI service daemon is offline
   * Matches the exact operational scoring rules & thresholds of POLARIS.
   */
  public computeInProcessFallback(request: PredictionRequestDto): PredictionResultDto {
    const fv = request.featureVector;
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30 min window

    // 1. Data Quality Evaluation
    let dataQuality: DataQuality = DataQuality.GOOD;
    let qualityReason = "Comprehensive telemetry and historical signals available";

    if (
      fv.currentTemperature === undefined ||
      fv.currentTemperature === null ||
      fv.currentHealthPercent === undefined ||
      fv.currentHealthPercent === null
    ) {
      dataQuality = DataQuality.INSUFFICIENT;
      qualityReason = "Critical telemetry sensors or baseline health missing";
    } else if (
      fv.tempMean7d === undefined ||
      fv.tempMean7d === null ||
      fv.alertCount7d === undefined
    ) {
      dataQuality = DataQuality.LIMITED;
      qualityReason = "Short historical telemetry window available (< 7 days)";
    }

    // 2. Health Score Calculation (0 - 100)
    let health = fv.currentHealthPercent ?? 85.0;

    // Thermal penalty
    if (fv.currentTemperature != null && fv.baselineTemp != null) {
      const deltaT = fv.currentTemperature - fv.baselineTemp;
      if (deltaT > 15) health -= 25;
      else if (deltaT > 8) health -= 12;
      else if (deltaT > 4) health -= 5;
    }

    // Vibration penalty
    if (fv.currentVibration != null && fv.baselineVibration != null) {
      const vibRatio = fv.currentVibration / Math.max(0.1, fv.baselineVibration);
      if (vibRatio >= 2.5) health -= 25;
      else if (vibRatio >= 1.7) health -= 14;
      else if (vibRatio >= 1.3) health -= 6;
    }

    // Alert penalties
    if (fv.criticalAlertCount7d && fv.criticalAlertCount7d > 0) {
      health -= Math.min(30, fv.criticalAlertCount7d * 15);
    }
    if (fv.highAlertCount7d && fv.highAlertCount7d > 0) {
      health -= Math.min(20, fv.highAlertCount7d * 7);
    }

    // Incident penalties
    if (fv.activeIncidentCount && fv.activeIncidentCount > 0) {
      health -= Math.min(25, fv.activeIncidentCount * 12);
    }

    // Maintenance interval penalty
    if (fv.daysSinceLastMaintenance != null && fv.daysSinceLastMaintenance > 90) {
      const overdueDays = fv.daysSinceLastMaintenance - 90;
      health -= Math.min(15, overdueDays * 0.2);
    }

    health = Math.max(0, Math.min(100, Math.round(health * 10) / 10));

    // Health Band
    let healthBand: "HEALTHY" | "GOOD" | "WATCH" | "DEGRADED" | "CRITICAL" = "HEALTHY";
    if (health >= 90) healthBand = "HEALTHY";
    else if (health >= 75) healthBand = "GOOD";
    else if (health >= 60) healthBand = "WATCH";
    else if (health >= 40) healthBand = "DEGRADED";
    else healthBand = "CRITICAL";

    // 3. Risk Score Calculation (0 - 100)
    let risk = (100 - health) * 0.7;

    if (fv.criticalAlertCount7d && fv.criticalAlertCount7d > 0) risk += 18;
    if (fv.highAlertCount7d && fv.highAlertCount7d > 0) risk += 10;
    if (fv.healthTrendSlope != null && fv.healthTrendSlope < -0.5) {
      risk += Math.min(20, Math.abs(fv.healthTrendSlope) * 6);
    }
    if (fv.tempTrendSlope != null && fv.tempTrendSlope > 0.5) {
      risk += Math.min(15, fv.tempTrendSlope * 4);
    }

    risk = Math.max(0, Math.min(100, Math.round(risk * 10) / 10));

    // Risk Band
    let riskBand: RiskBand = RiskBand.LOW;
    if (risk >= 80) riskBand = RiskBand.CRITICAL;
    else if (risk >= 60) riskBand = RiskBand.HIGH;
    else if (risk >= 40) riskBand = RiskBand.MODERATE;
    else if (risk >= 20) riskBand = RiskBand.GUARDED;
    else riskBand = RiskBand.LOW;

    // 4. RUL Estimation
    let rulHours: number | null = null;
    let rulDays: number | null = null;
    let rulEstimate: RulEstimateDto;

    if (dataQuality !== DataQuality.GOOD) {
      rulEstimate = {
        hours: null,
        days: null,
        minDays: null,
        maxDays: null,
        confidence: 0,
        status: "UNAVAILABLE",
        reason: "Insufficient historical degradation data — RUL estimate withheld to avoid fabrication."
      };
    } else if (health <= 40) {
      rulHours = 0;
      rulDays = 0;
      rulEstimate = {
        hours: 0,
        days: 0,
        minDays: 0,
        maxDays: 1,
        confidence: 95,
        status: "CRITICAL",
        reason: "Equipment health is at or below critical threshold (<= 40%). Immediate overhaul required."
      };
    } else if (fv.healthTrendSlope == null || fv.healthTrendSlope >= -0.05) {
      rulEstimate = {
        hours: null,
        days: null,
        minDays: null,
        maxDays: null,
        confidence: 85,
        status: "STABLE",
        reason: "Stable baseline operation — health degradation slope is near zero. Critical threshold projection not applicable."
      };
    } else {
      const dailyDegradation = Math.abs(fv.healthTrendSlope);
      const days = Math.round(((health - 40) / dailyDegradation) * 10) / 10;
      rulDays = days;
      rulHours = Math.round(days * 24 * 10) / 10;
      const confidence = Math.max(55, Math.min(90, Math.round((90 - days * 0.5) * 10) / 10));
      rulEstimate = {
        hours: rulHours,
        days: rulDays,
        minDays: Math.max(1, Math.round(days * 0.75 * 10) / 10),
        maxDays: Math.round(days * 1.35 * 10) / 10,
        confidence,
        status: "ESTIMATED",
        reason: `Linear degradation extrapolation based on ${dailyDegradation}% daily health decline towards 40% threshold.`
      };
    }

    // 5. Contributing Factors
    const topFactors: ContributingFactorDto[] = [];
    if (fv.currentTemperature != null && fv.baselineTemp != null && fv.currentTemperature > fv.baselineTemp + 5) {
      topFactors.push({
        factor: "Elevated Core Temperature",
        category: "THERMAL",
        severity: fv.currentTemperature > fv.baselineTemp + 15 ? "CRITICAL" : "HIGH",
        impactPercent: 30,
        description: `Operating at ${fv.currentTemperature}°C (+${(fv.currentTemperature - fv.baselineTemp).toFixed(1)}°C above nominal baseline of ${fv.baselineTemp}°C)`,
        metricValue: fv.currentTemperature,
        metricUnit: "°C"
      });
    }

    if (fv.currentVibration != null && fv.baselineVibration != null && fv.currentVibration > fv.baselineVibration * 1.3) {
      topFactors.push({
        factor: "Excess Mechanical Vibration",
        category: "VIBRATION",
        severity: fv.currentVibration > fv.baselineVibration * 2 ? "HIGH" : "MEDIUM",
        impactPercent: 25,
        description: `Vibration amplitude is ${fv.currentVibration.toFixed(2)} mm/s (${((fv.currentVibration / fv.baselineVibration - 1) * 100).toFixed(0)}% above baseline)`,
        metricValue: fv.currentVibration,
        metricUnit: "mm/s"
      });
    }

    if (fv.criticalAlertCount7d && fv.criticalAlertCount7d > 0) {
      topFactors.push({
        factor: "Active Safety System Alerts",
        category: "ALERT",
        severity: "CRITICAL",
        impactPercent: 35,
        description: `${fv.criticalAlertCount7d} critical Phase 9 alert(s) logged in the previous 7 days`,
        metricValue: fv.criticalAlertCount7d,
        metricUnit: "alerts"
      });
    }

    if (fv.healthTrendSlope != null && fv.healthTrendSlope < -0.3) {
      topFactors.push({
        factor: "Negative Health Trend Slope",
        category: "HEALTH_TREND",
        severity: "HIGH",
        impactPercent: 20,
        description: `Health index degrading at ${Math.abs(fv.healthTrendSlope).toFixed(2)}% per day over recent cycles`,
        metricValue: fv.healthTrendSlope,
        metricUnit: "%/day"
      });
    }

    if (topFactors.length === 0) {
      topFactors.push({
        factor: "Nominal Operating Parameters",
        category: "TELEMETRY",
        severity: "INFO",
        impactPercent: 5,
        description: "Equipment is operating within standard polar operational envelopes without anomalies.",
        metricValue: null,
        metricUnit: null
      });
    }

    // 6. Recommendation
    let recommendation = "Continue routine polar telemetry monitoring. No immediate maintenance intervention indicated.";
    if (riskBand === RiskBand.CRITICAL) {
      recommendation = "CRITICAL ADVISORY: Immediately prioritize engineering dispatch. Inspect thermal management, lubrication, and mechanical couplings within 12-24 hours.";
    } else if (riskBand === RiskBand.HIGH) {
      recommendation = "HIGH RISK WARNING: Schedule preventive maintenance inspection within 48-72 hours. Verify sensor calibration and coolant/oil levels.";
    } else if (riskBand === RiskBand.MODERATE) {
      recommendation = "MODERATE NOTICE: Increase monitoring frequency. Review weekly telemetry trends and inspect during next scheduled station maintenance cycle.";
    } else if (riskBand === RiskBand.GUARDED) {
      recommendation = "GUARDED STATUS: Equipment shows minor deviations from baseline. Continue normal monitoring and note sensor trends.";
    }

    return {
      healthScore: health,
      healthBand,
      riskScore: risk,
      riskBand,
      confidence: dataQuality === DataQuality.GOOD ? 88.0 : dataQuality === DataQuality.LIMITED ? 68.0 : 40.0,
      dataQuality,
      dataQualityReason: qualityReason,
      rul: rulEstimate,
      estimatedRulHours: rulHours,
      estimatedRulDays: rulDays,
      topFactors,
      recommendation,
      predictionHorizon: "7_DAYS",
      modelName: "polaris-heuristic-fallback",
      modelVersion: "1.0.0-fallback",
      featureVersion: "1.0",
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      isFallback: true
    };
  }
}

export const aiClientService = AiClientService.getInstance();
