import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AnalyticsFilterParams,
  EnvironmentAnalyticsResponse,
  ResolvedTimeWindow
} from "./analytics.types";
import {
  calculateAverage,
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class EnvironmentAnalyticsService {
  public async getEnvironmentAnalytics(
    params: AnalyticsFilterParams
  ): Promise<EnvironmentAnalyticsResponse> {
    const window: ResolvedTimeWindow = resolveTimeWindow(params);

    let stationFilter = {
      id: "ALL",
      code: "ALL",
      name: "All Antarctic Stations (Maitri & Bharati)"
    };

    const whereStationClause: any = {};
    if (params.stationId && params.stationId !== "ALL") {
      const station = await stationService.resolveStation(params.stationId);
      whereStationClause.stationId = station.id;
      stationFilter = {
        id: station.id,
        code: station.code,
        name: station.name
      };
    }

    const readings = await prisma.environmentalReading.findMany({
      where: {
        ...whereStationClause,
        recordedAt: {
          gte: window.currentStart,
          lte: window.currentEnd
        }
      },
      orderBy: { recordedAt: "asc" }
    });

    const count = readings.length;
    const durationHours = Math.max(1, window.durationMs / (1000 * 60 * 60));
    const dataQuality = evaluateDataQuality(count, 5, durationHours);

    if (count === 0) {
      return {
        station: stationFilter,
        timeWindow: {
          start: window.currentStart.toISOString(),
          end: window.currentEnd.toISOString()
        },
        metrics: {
          avgTemperature: null,
          minTemperature: null,
          maxTemperature: null,
          avgWindSpeed: null,
          maxWindSpeed: null,
          prevailingWindDirection: null,
          avgPressure: null,
          minPressure: null,
          maxPressure: null,
          avgHumidity: null,
          avgVisibility: null,
          avgSolarRadiation: null
        },
        thresholdExceedances: {
          extremeColdEvents: 0,
          blizzardConditionEvents: 0,
          highWindEvents: 0,
          lowPressureEvents: 0,
          hoursOutsideThresholds: 0
        },
        timeSeries: [],
        dataQuality
      };
    }

    const temperatures = readings.map((r) => r.temperature);
    const windSpeeds = readings.map((r) => r.windSpeed);
    const windDirs = readings.map((r) => r.windDirection);
    const pressures = readings.map((r) => r.pressure);
    const humidities = readings.map((r) => r.humidity);
    const visibilities = readings.map((r) => r.visibility);
    const solarRads = readings.map((r) => r.solarRadiation || 0);

    // Threshold checks (standard polar weather alert thresholds from Phase 7 & 9)
    let extremeColdEvents = 0;
    let blizzardConditionEvents = 0;
    let highWindEvents = 0;
    let lowPressureEvents = 0;
    let anomalousSamples = 0;

    for (const r of readings) {
      let isAnomalous = false;
      if (r.temperature < -40.0) {
        extremeColdEvents++;
        isAnomalous = true;
      }
      if (r.windSpeed > 70.0 && r.visibility < 1.0) {
        blizzardConditionEvents++;
        isAnomalous = true;
      }
      if (r.windSpeed > 60.0) {
        highWindEvents++;
        isAnomalous = true;
      }
      if (r.pressure < 970.0) {
        lowPressureEvents++;
        isAnomalous = true;
      }
      if (isAnomalous) anomalousSamples++;
    }

    const hoursOutsideThresholds = roundTo((anomalousSamples / count) * durationHours, 1) || 0;

    const step = Math.max(1, Math.floor(readings.length / 80));
    const timeSeries = readings
      .filter((_, idx) => idx % step === 0 || idx === readings.length - 1)
      .map((r) => ({
        timestamp: r.recordedAt.toISOString(),
        temperature: roundTo(r.temperature, 1) || 0,
        windSpeed: roundTo(r.windSpeed, 1) || 0,
        pressure: roundTo(r.pressure, 1) || 0,
        humidity: roundTo(r.humidity, 1) || 0,
        visibility: roundTo(r.visibility, 1) || 0,
        solarRadiation: roundTo(r.solarRadiation || 0, 1) || 0
      }));

    return {
      station: stationFilter,
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      metrics: {
        avgTemperature: calculateAverage(temperatures),
        minTemperature: roundTo(Math.min(...temperatures), 1),
        maxTemperature: roundTo(Math.max(...temperatures), 1),
        avgWindSpeed: calculateAverage(windSpeeds),
        maxWindSpeed: roundTo(Math.max(...windSpeeds), 1),
        prevailingWindDirection: calculateAverage(windDirs),
        avgPressure: calculateAverage(pressures),
        minPressure: roundTo(Math.min(...pressures), 1),
        maxPressure: roundTo(Math.max(...pressures), 1),
        avgHumidity: calculateAverage(humidities),
        avgVisibility: calculateAverage(visibilities),
        avgSolarRadiation: calculateAverage(solarRads)
      },
      thresholdExceedances: {
        extremeColdEvents,
        blizzardConditionEvents,
        highWindEvents,
        lowPressureEvents,
        hoursOutsideThresholds
      },
      timeSeries,
      dataQuality
    };
  }
}

export const environmentAnalyticsService = new EnvironmentAnalyticsService();
