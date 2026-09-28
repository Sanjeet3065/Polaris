import { EnvironmentalTelemetry } from "../types";

export const MOCK_ENVIRONMENT: Record<"MAITRI" | "BHARATI" | "ALL", EnvironmentalTelemetry> = {
  MAITRI: {
    stationCode: "MAITRI",
    timestamp: new Date().toISOString(),
    temperatureCelsius: -31.4,
    humidityPercentage: 72,
    atmosphericPressureHpa: 982,
    windSpeedKmh: 38,
    windDirectionDegrees: 155,
    windDirectionCompass: "SSE",
    visibilityKm: 12.4,
    solarRadiationWattsPerM2: 120,
    snowfallMmPerHour: 0.8,
    status: "NORMAL"
  },
  BHARATI: {
    stationCode: "BHARATI",
    timestamp: new Date().toISOString(),
    temperatureCelsius: -28.7,
    humidityPercentage: 69,
    atmosphericPressureHpa: 978,
    windSpeedKmh: 44,
    windDirectionDegrees: 110,
    windDirectionCompass: "ESE",
    visibilityKm: 16.8,
    solarRadiationWattsPerM2: 145,
    snowfallMmPerHour: 1.2,
    status: "NORMAL"
  },
  ALL: {
    stationCode: "BHARATI",
    timestamp: new Date().toISOString(),
    temperatureCelsius: -30.1,
    humidityPercentage: 71,
    atmosphericPressureHpa: 980,
    windSpeedKmh: 41,
    windDirectionDegrees: 135,
    windDirectionCompass: "SE",
    visibilityKm: 14.6,
    solarRadiationWattsPerM2: 133,
    snowfallMmPerHour: 1.0,
    status: "NORMAL"
  }
};
