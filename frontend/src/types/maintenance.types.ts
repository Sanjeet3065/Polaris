export type RiskBand = "LOW" | "GUARDED" | "MODERATE" | "HIGH" | "CRITICAL";

export type HealthBand = "HEALTHY" | "GOOD" | "WATCH" | "DEGRADED" | "CRITICAL";

export type DataQuality = "GOOD" | "LIMITED" | "INSUFFICIENT";

export interface ContributingFactor {
  factor: string;
  category: "TELEMETRY" | "VIBRATION" | "THERMAL" | "ALERT" | "INCIDENT" | "MAINTENANCE" | "HEALTH_TREND" | "LOAD";
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impactPercent: number;
  description: string;
  metricValue?: number | null;
  metricUnit?: string | null;
}

export interface RulEstimate {
  hours?: number | null;
  days?: number | null;
  minDays?: number | null;
  maxDays?: number | null;
  confidence: number;
  status: "ESTIMATED" | "STABLE" | "CRITICAL" | "UNAVAILABLE";
  reason: string;
}

export interface MaintenancePrediction {
  id: string;
  equipmentId: string;
  stationId: string;
  healthScore: number;
  riskScore: number;
  riskBand: RiskBand;
  estimatedRulHours?: number | null;
  estimatedRulDays?: number | null;
  confidence: number;
  dataQuality: DataQuality;
  predictionHorizon: string;
  modelName: string;
  modelVersion: string;
  featureVersion: string;
  topFactors: string; // JSON array of ContributingFactor
  recommendation: string;
  telemetrySnapshot?: string | null;
  generatedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  equipment?: {
    id: string;
    code: string;
    name: string;
    category: string;
    status: string;
  };
  station?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface DetailedPredictionView {
  prediction: MaintenancePrediction;
  equipment: {
    id: string;
    code: string;
    name: string;
    category: string;
    status: string;
    stationId: string;
    stationCode: string;
    stationName: string;
  };
  relatedAlerts: Array<{
    id: string;
    ruleCode: string;
    severity: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
  relatedIncidents: Array<{
    id: string;
    incidentNumber: string;
    title: string;
    severity: string;
    status: string;
    createdAt: string;
  }>;
  maintenanceHistory: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    scheduledAt: string;
    completedAt?: string | null;
    notes?: string | null;
  }>;
  healthHistory: Array<{
    recordedAt: string;
    healthScore: number;
    temperature: number | null;
    vibration: number | null;
    operatingHours: number | null;
  }>;
  riskTrend: Array<{
    timestamp: string;
    riskScore: number;
    healthScore: number;
    riskBand: RiskBand;
  }>;
}

export interface HealthOverviewStats {
  monitoredCount: number;
  healthyCount: number;
  goodCount: number;
  watchCount: number;
  degradedCount: number;
  criticalCount: number;
  atRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  averageHealthScore: number;
  averageRiskScore: number;
  stationBreakdown?: Record<string, {
    monitored: number;
    atRisk: number;
    averageHealth: number;
    averageRisk: number;
  }>;
}

export interface PredictionFilterState {
  stationId: string;
  riskBand: string;
  search: string;
  page: number;
  limit: number;
}
