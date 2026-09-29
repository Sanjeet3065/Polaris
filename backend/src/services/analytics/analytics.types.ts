export type TimeRangeOption = "1h" | "6h" | "24h" | "7d" | "30d" | "custom";

export interface AnalyticsFilterParams {
  stationId?: string; // "ALL" or UUID or station code
  timeRange?: TimeRangeOption;
  startDate?: string;
  endDate?: string;
  equipmentId?: string;
  category?: string;
  severity?: string;
  status?: string;
}

export interface ResolvedTimeWindow {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  durationMs: number;
  timeRange: TimeRangeOption;
}

export type TrendDirection = "RISING" | "FALLING" | "STABLE" | "INSUFFICIENT_DATA";

export type MetricStatus = "NORMAL" | "WARNING" | "CRITICAL" | "NEUTRAL";

export type DataQualityRating = "GOOD" | "LIMITED" | "POOR";

export interface DataQualityReport {
  rating: DataQualityRating;
  coveragePercent: number;
  expectedSampleCount: number;
  actualSampleCount: number;
  dataGapsDetected: boolean;
  notes: string;
}

export interface TopKpiCard {
  key: string;
  label: string;
  currentValue: number | null;
  previousValue: number | null;
  unit: string;
  changePercent: number | null;
  trend: TrendDirection;
  status: MetricStatus;
  neutralChange: boolean;
  freshnessTimestamp: string | null;
}

export interface OperationalSummary {
  periodLabel: string;
  stationLabel: string;
  generatedAt: string;
  dataQuality: DataQualityReport;
  keyObservations: string[];
  energy: {
    generationKwh: number;
    consumptionKwh: number;
    netKwh: number;
    batterySocPercent: number | null;
    fuelAutonomyDays: number | null;
  };
  alerts: {
    total: number;
    open: number;
    critical: number;
  };
  incidents: {
    total: number;
    open: number;
  };
  equipment: {
    monitoredCount: number;
    highRiskCount: number;
    avgHealthPercent: number | null;
  };
  inventory: {
    totalItems: number;
    criticalCount: number;
    lowStockCount: number;
  };
}

export interface OverviewAnalyticsResponse {
  timeWindow: {
    start: string;
    end: string;
    timeRange: TimeRangeOption;
  };
  station: {
    id: string;
    code: string;
    name: string;
  };
  kpiCards: TopKpiCard[];
  summary: OperationalSummary;
  dataQuality: DataQualityReport;
}

export interface EnergyAnalyticsResponse {
  station: { id: string; code: string; name: string };
  timeWindow: { start: string; end: string };
  metrics: {
    totalGenerationKwh: number;
    avgGenerationKw: number;
    peakGenerationKw: number;
    totalConsumptionKwh: number;
    avgConsumptionKw: number;
    peakConsumptionKw: number;
    netPowerKw: number;
    netEnergyKwh: number;
    avgBatteryPercent: number | null;
    minBatteryPercent: number | null;
    maxBatteryPercent: number | null;
    avgBatteryVoltage: number | null;
    avgFuelPercent: number | null;
    fuelLiters: number | null;
    fuelDaysRemaining: number | null;
    solarGenerationKwh: number;
    solarFractionPercent: number | null;
    generatorUtilizationPercent: number | null;
  };
  timeSeries: {
    timestamp: string;
    generationKw: number;
    consumptionKw: number;
    netKw: number;
    batteryPercent: number;
    fuelPercent: number;
    solarKw: number;
    dieselKw: number;
  }[];
  stationComparison?: {
    stationCode: string;
    stationName: string;
    avgGenerationKw: number;
    avgConsumptionKw: number;
    avgBatteryPercent: number;
    avgFuelPercent: number;
  }[];
  dataQuality: DataQualityReport;
}

export interface EnvironmentAnalyticsResponse {
  station: { id: string; code: string; name: string };
  timeWindow: { start: string; end: string };
  metrics: {
    avgTemperature: number | null;
    minTemperature: number | null;
    maxTemperature: number | null;
    avgWindSpeed: number | null;
    maxWindSpeed: number | null;
    prevailingWindDirection: number | null;
    avgPressure: number | null;
    minPressure: number | null;
    maxPressure: number | null;
    avgHumidity: number | null;
    avgVisibility: number | null;
    avgSolarRadiation: number | null;
  };
  thresholdExceedances: {
    extremeColdEvents: number; // temp < -40°C
    blizzardConditionEvents: number; // wind > 70 km/h and visibility < 1 km
    highWindEvents: number; // wind > 60 km/h
    lowPressureEvents: number; // pressure < 970 hPa
    hoursOutsideThresholds: number;
  };
  timeSeries: {
    timestamp: string;
    temperature: number;
    windSpeed: number;
    pressure: number;
    humidity: number;
    visibility: number;
    solarRadiation: number;
  }[];
  dataQuality: DataQualityReport;
}

export interface EquipmentAnalyticsItem {
  id: string;
  code: string;
  name: string;
  stationCode: string;
  category: string;
  status: string;
  healthPercent: number;
  avgHistoricalHealth: number | null;
  minHistoricalHealth: number | null;
  maxHistoricalHealth: number | null;
  riskScore: number | null;
  riskBand: string | null;
  estimatedRulDays: number | null;
  alertCount: number;
  incidentCount: number;
  maintenanceCount: number;
  lastServiceAt: string | null;
}

export interface EquipmentAnalyticsResponse {
  station: { id: string; code: string; name: string };
  timeWindow: { start: string; end: string };
  summary: {
    totalMonitored: number;
    avgHealthScore: number;
    healthyCount: number; // >= 80
    degradedCount: number; // 50-79
    criticalCount: number; // < 50
  };
  healthDistribution: {
    band: string;
    count: number;
    percentage: number;
  }[];
  riskDistribution: {
    band: string;
    count: number;
  }[];
  equipment: EquipmentAnalyticsItem[];
  dataQuality: DataQualityReport;
}

export interface MaintenanceAnalyticsResponse {
  station: { id: string; code: string; name: string };
  timeWindow: { start: string; end: string };
  summary: {
    totalPredictions: number;
    avgRiskScore: number | null;
    avgHealthScore: number | null;
    criticalRiskCount: number;
    highRiskCount: number;
    moderateRiskCount: number;
    lowRiskCount: number;
    avgRulDays: number | null;
    workOrdersCreatedCount: number;
  };
  riskDistribution: { band: string; count: number }[];
  healthDistribution: { band: string; count: number }[];
  rulDistribution: { range: string; count: number }[];
  predictions: {
    id: string;
    equipmentId: string;
    equipmentCode: string;
    equipmentName: string;
    stationCode: string;
    healthScore: number;
    riskScore: number;
    riskBand: string;
    estimatedRulDays: number | null;
    confidence: number;
    recommendation: string;
    generatedAt: string;
  }[];
  maintenanceHistory: {
    id: string;
    equipmentCode: string;
    title: string;
    type: string;
    status: string;
    scheduledAt: string;
    completedAt: string | null;
  }[];
  dataQuality: DataQualityReport;
}

export interface AlertAnalyticsResponse {
  station: { id: string; code: string; name: string };
  timeWindow: { start: string; end: string };
  summary: {
    totalAlerts: number;
    openAlerts: number;
    acknowledgedAlerts: number;
    resolvedAlerts: number;
    suppressedAlerts: number;
    mttaMinutes: number | null; // Mean Time to Acknowledge
    mttrMinutes: number | null; // Mean Time to Resolve
  };
  bySeverity: Record<string, number>;
  byStation: Record<string, number>;
  bySource: Record<string, number>;
  topRules: {
    ruleCode: string;
    title: string;
    count: number;
    severity: string;
  }[];
  timeSeries: {
    timestamp: string;
    total: number;
    critical: number;
  }[];
  dataQuality: DataQualityReport;
}

export interface IncidentAnalyticsResponse {
  station: { id: string; code: string; name: string };
  timeWindow: { start: string; end: string };
  summary: {
    totalIncidents: number;
    openIncidents: number;
    investigatingIncidents: number;
    mitigatingIncidents: number;
    resolvedIncidents: number;
    closedIncidents: number;
    avgResolutionHours: number | null;
    linkedAlertCount: number;
  };
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  byStation: Record<string, number>;
  timeSeries: {
    timestamp: string;
    count: number;
  }[];
  recentIncidents: {
    id: string;
    incidentNumber: string;
    title: string;
    stationCode: string;
    severity: string;
    status: string;
    category: string;
    startedAt: string;
    resolvedAt: string | null;
    alertCount: number;
  }[];
  dataQuality: DataQualityReport;
}

export interface LogisticsAnalyticsResponse {
  station: { id: string; code: string; name: string };
  timeWindow: { start: string; end: string };
  summary: {
    totalItems: number;
    criticalStockItems: number;
    lowStockItems: number;
    healthyStockItems: number;
    totalMovements: number;
    consumptionMovements: number;
    receiptMovements: number;
    transferMovements: number;
    totalShipments: number;
  };
  categoryDistribution: {
    category: string;
    itemCount: number;
    totalQuantity: number;
    criticalCount: number;
  }[];
  shipmentStatusDistribution: Record<string, number>;
  recentMovements: {
    id: string;
    itemName: string;
    sku: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    createdAt: string;
  }[];
  dataQuality: DataQualityReport;
}

export interface StationComparisonMetric {
  metric: string;
  unit: string;
  maitriValue: number | string | null;
  bharatiValue: number | string | null;
  note: string;
}

export interface StationComparisonResponse {
  timeWindow: { start: string; end: string };
  stations: {
    code: string;
    name: string;
    healthPercent: number;
    energy: {
      avgGenerationKw: number;
      avgConsumptionKw: number;
      avgBatteryPercent: number;
      fuelPercent: number;
    };
    environment: {
      avgTemp: number;
      avgWindSpeed: number;
      avgPressure: number;
      avgVisibility: number;
    };
    equipment: {
      total: number;
      avgHealth: number;
      criticalRiskCount: number;
    };
    alerts: {
      total: number;
      open: number;
      critical: number;
    };
    incidents: {
      total: number;
      open: number;
    };
    logistics: {
      totalItems: number;
      criticalItems: number;
    };
  }[];
  comparisonTable: StationComparisonMetric[];
  observations: string[];
}

export type ReportType =
  | "DAILY_OPERATIONS"
  | "WEEKLY_OPERATIONS"
  | "ENERGY_ANALYSIS"
  | "ENVIRONMENT_CLIMATE"
  | "EQUIPMENT_HEALTH"
  | "ALERTS_INCIDENTS"
  | "MAINTENANCE_INTELLIGENCE"
  | "LOGISTICS_INVENTORY"
  | "STATION_COMPARISON";

export interface GeneratedReport {
  id: string;
  reportType: ReportType;
  title: string;
  station: { id: string; code: string; name: string };
  generatedAt: string;
  generatedBy: string;
  period: { start: string; end: string; label: string };
  dataQuality: DataQualityReport;
  executiveSummary: string;
  keyMetrics: TopKpiCard[];
  tables: {
    name: string;
    columns: string[];
    rows: (string | number | null)[][];
  }[];
  observations: string[];
  notes: string[];
}
