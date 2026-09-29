/**
 * POLARIS — 3D Digital Twin Type Definitions
 * Phase 6 Architecture
 */

import { StationCode, EquipmentStatus, AlertSeverity } from "../../types";

export type DigitalTwinCameraPreset = "default" | "top" | "station" | "equipment";

export interface DigitalTwinLayerState {
  buildings: boolean;
  equipment: boolean;
  alerts: boolean;
  environment: boolean;
}

export interface Equipment3DPosition {
  equipmentId: string;
  stationCode: StationCode;
  name: string;
  category: "POWER" | "HVAC" | "LIFE_SUPPORT" | "COMMUNICATION" | "WATER_SYSTEM" | "SCIENCE";
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  buildingRef: string;
  modelType: "GENERATOR" | "HVAC" | "CONVERTER" | "ANTENNA" | "WATER_PUMP" | "BATTERY" | "FUEL_TANK";
  description: string;
}

export interface Equipment3DState {
  id: string;
  name: string;
  category: string;
  status: EquipmentStatus;
  healthScore: number;
  temperature?: number;
  vibration?: number;
  loadPercent?: number;
  lastChecked: string;
  modelNumber?: string;
  hasActiveAlert?: boolean;
  activeAlertSeverity?: AlertSeverity;
  activeAlertTitle?: string;
  riskScore?: number;
  riskBand?: "LOW" | "GUARDED" | "MODERATE" | "HIGH" | "CRITICAL";
  estimatedRulDays?: number | null;
}

export interface Station3DState {
  stationCode: StationCode;
  stationName: string;
  healthScore: number;
  operationalStatus: "OPTIMAL" | "DEGRADED" | "CRITICAL" | "OFFLINE";
  temperatureCelsius: number;
  windSpeedKmH: number;
  relativeHumidityPercent: number;
  barometricPressureHpa: number;
  totalGenerationKw: number;
  totalConsumptionKw: number;
  batteryPercentage: number;
  fuelReservesPercent: number;
  activeScenario?: string | null;
}

export interface DigitalTwinSelection {
  equipmentId: string | null;
  buildingId: string | null;
}
