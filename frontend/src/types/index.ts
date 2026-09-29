/**
 * POLARIS — Central Domain Type Definitions
 * SIH 2026 Problem Statement: SIH26060
 */

export type StationCode = "MAITRI" | "BHARATI";
export type StationFilter = "MAITRI" | "BHARATI" | "ALL";

export type StationStatus = "OPERATIONAL" | "DEGRADED" | "WARNING" | "CRITICAL" | "OFFLINE";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
export type BatteryStatus = "CHARGING" | "STABLE" | "DISCHARGING";
export type EquipmentStatus = "HEALTHY" | "WARNING" | "CRITICAL" | "OFFLINE";

export interface StationLocation {
  lat: number;
  lng: number;
  altitudeMeters: number;
  region: string;
}

export interface Station {
  id: string;
  code: StationCode;
  name: string;
  tagline: string;
  location: StationLocation;
  commissionedYear: number;
  operationalStatus: StationStatus;
  personnelCapacity: number;
  currentPersonnelCount: number;
  systemHealthPercent: number;
}

export interface Building {
  id: string;
  stationId: string;
  name: string;
  type: "MAIN_BASE" | "LABORATORY" | "GENERATOR_STATION" | "FUEL_FARM" | "STORAGE" | "LIVING_QUARTERS";
  floorsCount: number;
}

export interface Room {
  id: string;
  buildingId: string;
  name: string;
  roomNumber: string;
  type: "LIVING" | "SCIENCE_LAB" | "GENERATOR_ROOM" | "SERVER_ROOM" | "MEDICAL_BAY" | "KITCHEN";
}

export interface Equipment {
  id: string;
  stationId: StationCode;
  roomId?: string;
  name: string;
  category: "POWER" | "HVAC" | "LIFE_SUPPORT" | "COMMUNICATION" | "WATER_SYSTEM" | "SCIENCE";
  status: EquipmentStatus;
  healthScore: number; // 0 - 100
  lastChecked: string;
  modelNumber?: string;
  digitalTwinModelRef?: string;
}

export interface EnvironmentalTelemetry {
  stationCode: StationCode;
  timestamp: string;
  temperatureCelsius: number;
  humidityPercentage: number;
  atmosphericPressureHpa: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  windDirectionCompass: string;
  visibilityKm: number;
  solarRadiationWattsPerM2: number;
  snowfallMmPerHour: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface EnergyTelemetry {
  stationCode: StationCode;
  timestamp: string;
  solarGenerationKw: number;
  dieselGenerationKw: number;
  totalGenerationKw: number;
  totalConsumptionKw: number;
  netPowerBalanceKw: number;
  batteryPercentage: number;
  batteryStatus: BatteryStatus;
  batteryVoltageV: number;
  fuelReservesPercent: number;
  fuelReservesLiters: number;
  fuelAutonomyDaysRemaining: number;
}

export interface Alert {
  id: string;
  stationCode: StationCode;
  severity: AlertSeverity;
  source: "ENVIRONMENT" | "ENERGY" | "EQUIPMENT" | "INVENTORY" | "LOGISTICS" | "COMMUNICATION" | "SYSTEM";
  title: string;
  description: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  acknowledgedAt?: string;
}

export interface OperationalEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  eventType: "TELEMETRY" | "HEALTH_CHECK" | "BATTERY" | "INVENTORY" | "WEATHER" | "MAINTENANCE";
  description: string;
  status: "SUCCESS" | "INFO" | "WARNING" | "CRITICAL";
  stationCode?: StationCode;
}

export interface HourlyPowerDataPoint {
  time: string;
  generation: number;
  consumption: number;
}

export interface HourlyTemperatureDataPoint {
  time: string;
  temperature: number;
  windSpeed: number;
}

export interface StationComparisonMetric {
  metric: string;
  unit: string;
  maitriValue: number;
  bharatiValue: number;
  displayMaitri: string;
  displayBharati: string;
  benchmark: "higher-better" | "lower-better" | "neutral";
}

export type UserRole =
  | "SUPER_ADMIN"
  | "STATION_ADMIN"
  | "OPERATOR"
  | "SCIENTIST"
  | "LOGISTICS_MANAGER"
  | "VIEWER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  stationAssignment?: StationCode;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
