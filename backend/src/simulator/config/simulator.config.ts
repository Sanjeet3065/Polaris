import { NoiseConfig, NoiseLevel } from "../models/simulator.types";

export const SIMULATOR_LIMITS = {
  MIN_INTERVAL_MS: 500,
  MAX_INTERVAL_MS: 3600000, // 1 hour
  DEFAULT_INTERVAL_MS: 5000,
  DEFAULT_NOISE_LEVEL: "MEDIUM" as NoiseLevel,
  
  // Antarctic physical sanity bounds
  ENVIRONMENT: {
    MIN_TEMP_C: -65.0,
    MAX_TEMP_C: 10.0,
    MIN_HUMIDITY_PERCENT: 15.0,
    MAX_HUMIDITY_PERCENT: 98.0,
    MIN_PRESSURE_HPA: 920.0,
    MAX_PRESSURE_HPA: 1045.0,
    MIN_WIND_KMH: 0.0,
    MAX_WIND_KMH: 220.0,
    MIN_VISIBILITY_KM: 0.05, // Blizzard whiteout threshold
    MAX_VISIBILITY_KM: 55.0,
    MIN_SOLAR_WM2: 0.0,
    MAX_SOLAR_WM2: 1200.0,
    MIN_SNOWFALL_MMH: 0.0,
    MAX_SNOWFALL_MMH: 30.0
  },
  
  ENERGY: {
    MIN_BATTERY_PERCENT: 0.0,
    MAX_BATTERY_PERCENT: 100.0,
    MIN_BATTERY_VOLTS: 40.0,
    MAX_BATTERY_VOLTS: 56.0,
    MIN_FUEL_PERCENT: 0.0,
    MAX_FUEL_PERCENT: 100.0,
    MIN_POWER_KW: 0.0,
    MAX_POWER_KW: 1000.0
  },

  EQUIPMENT: {
    MIN_HEALTH_PERCENT: 0.0,
    MAX_HEALTH_PERCENT: 100.0,
    MIN_VIBRATION_RMS: 0.0,
    MAX_VIBRATION_RMS: 15.0,
    MIN_TEMP_C: -30.0,
    MAX_TEMP_C: 140.0
  }
};

export const NOISE_PROFILES: Record<NoiseLevel, NoiseConfig> = {
  LOW: {
    tempNoise: 0.08,
    humidityNoise: 0.4,
    pressureNoise: 0.4,
    windNoise: 1.2,
    powerNoise: 1.5,
    batteryNoise: 0.05,
    fuelNoise: 0.02,
    equipmentTempNoise: 0.2,
    vibrationNoise: 0.05
  },
  MEDIUM: {
    tempNoise: 0.2,
    humidityNoise: 1.0,
    pressureNoise: 1.2,
    windNoise: 3.0,
    powerNoise: 3.5,
    batteryNoise: 0.15,
    fuelNoise: 0.06,
    equipmentTempNoise: 0.5,
    vibrationNoise: 0.12
  },
  HIGH: {
    tempNoise: 0.45,
    humidityNoise: 2.2,
    pressureNoise: 2.5,
    windNoise: 6.5,
    powerNoise: 7.0,
    batteryNoise: 0.35,
    fuelNoise: 0.15,
    equipmentTempNoise: 1.2,
    vibrationNoise: 0.28
  }
};
