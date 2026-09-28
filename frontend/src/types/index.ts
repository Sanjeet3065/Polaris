/**
 * POLARIS — Central Domain Type Definitions
 * SIH 2026 Problem Statement: SIH26060
 */

export type StationCode = "MAITRI" | "BHARATI";

export interface Station {
  id: string;
  code: StationCode;
  name: string;
  tagline: string;
  location: {
    lat: number;
    lng: number;
    altitudeMeters: number;
    region: string;
  };
  commissionedYear: number;
  operationalStatus: "ACTIVE" | "MAINTENANCE" | "EMERGENCY_MINIMAL";
  personnelCapacity: number;
  currentPersonnelCount: number;
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
  roomId: string;
  name: string;
  category: "GENERATOR" | "HVAC" | "WATER_MAKER" | "SOLAR_ARRAY" | "BATTERY_BANK" | "COMMUNICATION" | "LAB_ANALYZER";
  status: "OPTIMAL" | "WARNING" | "CRITICAL" | "OFFLINE";
  healthScore: number; // 0 - 100
  installedDate: string;
  lastMaintainedDate: string;
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
  visibilityKm: number;
  solarRadiationWattsPerM2: number;
  snowfallMmPerHour: number;
}

export interface EnergyTelemetry {
  stationCode: StationCode;
  timestamp: string;
  solarGenerationKw: number;
  dieselGenerationKw: number;
  totalLoadKw: number;
  batteryStateOfChargePercent: number;
  batteryVoltageV: number;
  fuelReservesLiters: number;
  fuelAutonomyDaysRemaining: number;
}

export interface Alert {
  id: string;
  stationCode: StationCode;
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
  source: "ENVIRONMENT" | "ENERGY" | "EQUIPMENT" | "INVENTORY" | "LOGISTICS" | "COMMUNICATION" | "SYSTEM";
  title: string;
  description: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  acknowledgedAt?: string;
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
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
