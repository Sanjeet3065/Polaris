import { EquipmentStatus, TelemetryStatus, StationStatus } from "@prisma/client";

export type StationCode = "MAITRI" | "BHARATI";

export type NoiseLevel = "LOW" | "MEDIUM" | "HIGH";

export type ScenarioType =
  | "NORMAL"
  | "GENERATOR_OVERHEAT"
  | "BATTERY_LOW"
  | "HIGH_WIND"
  | "POWER_SHORTAGE"
  | "LOW_FUEL"
  | "COMMUNICATION_DEGRADED"
  | "EQUIPMENT_DEGRADATION";

export interface NoiseConfig {
  tempNoise: number;
  humidityNoise: number;
  pressureNoise: number;
  windNoise: number;
  powerNoise: number;
  batteryNoise: number;
  fuelNoise: number;
  equipmentTempNoise: number;
  vibrationNoise: number;
}

export interface StationBaseline {
  code: StationCode;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  temperature: number;      // °C
  humidity: number;         // %
  pressure: number;         // hPa
  windSpeed: number;        // km/h
  windDirection: number;    // degrees (0-360)
  windDirectionCompass: string;
  visibility: number;       // km
  solarRadiation: number;   // W/m²
  snowfallRate: number;     // mm/h
  powerGenerationKw: number;// kW
  solarKw: number;          // kW
  dieselKw: number;         // kW
  powerConsumptionKw: number;// kW
  batteryPercent: number;   // %
  batteryVoltage: number;   // Volts
  fuelPercent: number;      // %
  fuelLiters: number;       // Liters
  fuelDaysRemaining: number;// Days
}

export interface ScenarioDefinition {
  type: ScenarioType;
  name: string;
  description: string;
  defaultDurationSeconds: number;
  defaultIntensity: number; // 0.0 to 1.0
  targetDomain: "ENVIRONMENT" | "ENERGY" | "EQUIPMENT" | "STATION" | "ALL";
}

export interface ActiveScenario {
  id: string;
  stationCode: StationCode;
  type: ScenarioType;
  intensity: number; // 0.0 to 1.0
  durationSeconds: number;
  startedAt: Date;
  elapsedSeconds: number;
  status: "ACTIVE" | "STOPPED" | "COMPLETED";
}

export interface SimulatedEquipmentState {
  id: string;
  code: string;
  name: string;
  category: string;
  temperature: number;
  vibration: number;
  loadPercent: number;
  healthPercent: number;
  runtimeHours: number;
  status: EquipmentStatus;
  notes: string;
}

export interface StationSimulationState {
  stationId: string;
  stationCode: StationCode;
  lastTickAt: Date;
  currentEnvironment: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windDirectionCompass: string;
    visibility: number;
    solarRadiation: number;
    snowfallRate: number;
    status: TelemetryStatus;
  };
  currentEnergy: {
    generationKw: number;
    solarKw: number;
    dieselKw: number;
    consumptionKw: number;
    netPowerKw: number;
    batteryPercent: number;
    batteryVoltage: number;
    fuelPercent: number;
    fuelLiters: number;
    fuelDaysRemaining: number;
  };
  equipmentStates: Map<string, SimulatedEquipmentState>;
  activeScenario: ActiveScenario | null;
  recoveryProgress: number; // 0.0 (just finished anomaly) to 1.0 (fully recovered to baseline)
}

export interface GeneratedTelemetryCycle {
  stationId: string;
  stationCode: StationCode;
  timestamp: Date;
  stationTelemetry: {
    stationId: string;
    recordedAt: Date;
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
  };
  environmentalReading: {
    stationId: string;
    recordedAt: Date;
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windDirectionCompass: string;
    visibility: number;
    solarRadiation: number;
    snowfallRate: number;
    status: TelemetryStatus;
  };
  energyReading: {
    stationId: string;
    recordedAt: Date;
    generationKw: number;
    solarKw: number;
    dieselKw: number;
    consumptionKw: number;
    netPowerKw: number;
    batteryPercent: number;
    batteryVoltage: number;
    fuelPercent: number;
    fuelLiters: number;
    fuelDaysRemaining: number;
  };
  equipmentHealth: Array<{
    equipmentId: string;
    recordedAt: Date;
    healthPercent: number;
    temperature: number;
    vibration: number;
    runtimeHours: number;
    status: EquipmentStatus;
    notes: string;
  }>;
  stationHealthPercent: number;
  stationStatus: StationStatus;
}

export interface SimulatorStatus {
  enabled: boolean;
  running: boolean;
  intervalMs: number;
  noiseLevel: NoiseLevel;
  totalTicks: number;
  totalReadingsGenerated: number;
  lastTickAt: string | null;
  stations: Array<{
    code: StationCode;
    id: string;
    healthPercent: number;
    status: string;
    activeScenario: ScenarioType | null;
    environment: {
      temperature: number;
      humidity: number;
      pressure: number;
      windSpeed: number;
      compass: string;
    };
    energy: {
      generationKw: number;
      consumptionKw: number;
      netPowerKw: number;
      batteryPercent: number;
      fuelPercent: number;
    };
    equipmentCount: number;
  }>;
  activeScenarios: ActiveScenario[];
}

export interface ManualTickSummary {
  stationCount: number;
  telemetryRecords: number;
  energyRecords: number;
  environmentRecords: number;
  equipmentRecords: number;
  timestamp: string;
}
