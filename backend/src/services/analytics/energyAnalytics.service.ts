import { prisma } from "../../config/prisma";
import { stationService } from "../station.service";
import {
  AnalyticsFilterParams,
  EnergyAnalyticsResponse,
  ResolvedTimeWindow
} from "./analytics.types";
import {
  calculateAverage,
  evaluateDataQuality,
  resolveTimeWindow,
  roundTo
} from "./analyticsUtils";

export class EnergyAnalyticsService {
  public async getEnergyAnalytics(
    params: AnalyticsFilterParams
  ): Promise<EnergyAnalyticsResponse> {
    const window: ResolvedTimeWindow = resolveTimeWindow(params);

    // Resolve station filter
    let stationFilter: { id: string; code: string; name: string } = {
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

    // Query energy readings in the time window
    const readings = await prisma.energyReading.findMany({
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
    // Telemetry nominally sampled at ~5 min intervals
    const dataQuality = evaluateDataQuality(count, 5, durationHours);

    if (count === 0) {
      return {
        station: stationFilter,
        timeWindow: {
          start: window.currentStart.toISOString(),
          end: window.currentEnd.toISOString()
        },
        metrics: {
          totalGenerationKwh: 0,
          avgGenerationKw: 0,
          peakGenerationKw: 0,
          totalConsumptionKwh: 0,
          avgConsumptionKw: 0,
          peakConsumptionKw: 0,
          netPowerKw: 0,
          netEnergyKwh: 0,
          avgBatteryPercent: null,
          minBatteryPercent: null,
          maxBatteryPercent: null,
          avgBatteryVoltage: null,
          avgFuelPercent: null,
          fuelLiters: null,
          fuelDaysRemaining: null,
          solarGenerationKwh: 0,
          solarFractionPercent: null,
          generatorUtilizationPercent: null
        },
        timeSeries: [],
        dataQuality
      };
    }

    // Aggregations
    const genKws = readings.map((r) => r.generationKw);
    const consKws = readings.map((r) => r.consumptionKw);
    const batteryPercents = readings.map((r) => r.batteryPercent);
    const batteryVoltages = readings.map((r) => r.batteryVoltage);
    const fuelPercents = readings.map((r) => r.fuelPercent);
    const fuelLitersList = readings.map((r) => r.fuelLiters);
    const fuelDaysList = readings.map((r) => r.fuelDaysRemaining);
    const solarKws = readings.map((r) => r.solarKw || 0);
    const dieselKws = readings.map((r) => r.dieselKw || 0);

    const avgGenKw = calculateAverage(genKws) || 0;
    const peakGenKw = roundTo(Math.max(...genKws), 1) || 0;

    const avgConsKw = calculateAverage(consKws) || 0;
    const peakConsKw = roundTo(Math.max(...consKws), 1) || 0;

    // Numerical integration for energy: Average Power (kW) * Hours = kWh
    const totalGenKwh = roundTo(avgGenKw * durationHours, 1) || 0;
    const totalConsKwh = roundTo(avgConsKw * durationHours, 1) || 0;
    const netPowerKw = roundTo(avgGenKw - avgConsKw, 1) || 0;
    const netEnergyKwh = roundTo(totalGenKwh - totalConsKwh, 1) || 0;

    const avgSolarKw = calculateAverage(solarKws) || 0;
    const totalSolarKwh = roundTo(avgSolarKw * durationHours, 1) || 0;
    const solarFraction = totalGenKwh > 0 ? roundTo((totalSolarKwh / totalGenKwh) * 100, 1) : 0;

    const avgDieselKw = calculateAverage(dieselKws) || 0;
    // Rated polar diesel capacity benchmark ~ 200 kW
    const genUtilization = roundTo(Math.min(100, (avgDieselKw / 200) * 100), 1);

    const latest = readings[readings.length - 1];

    // Downsample timeseries if > 100 points
    const step = Math.max(1, Math.floor(readings.length / 80));
    const timeSeries = readings
      .filter((_, idx) => idx % step === 0 || idx === readings.length - 1)
      .map((r) => ({
        timestamp: r.recordedAt.toISOString(),
        generationKw: roundTo(r.generationKw, 1) || 0,
        consumptionKw: roundTo(r.consumptionKw, 1) || 0,
        netKw: roundTo(r.netPowerKw ?? r.generationKw - r.consumptionKw, 1) || 0,
        batteryPercent: roundTo(r.batteryPercent, 1) || 0,
        fuelPercent: roundTo(r.fuelPercent, 1) || 0,
        solarKw: roundTo(r.solarKw || 0, 1) || 0,
        dieselKw: roundTo(r.dieselKw || 0, 1) || 0
      }));

    // Station comparative breakdown if 'ALL' is chosen
    let stationComparison: EnergyAnalyticsResponse["stationComparison"] = undefined;
    if (stationFilter.code === "ALL") {
      const allStations = await prisma.station.findMany({ select: { id: true, code: true, name: true } });
      stationComparison = [];

      for (const st of allStations) {
        const stReadings = readings.filter((r) => r.stationId === st.id);
        if (stReadings.length > 0) {
          stationComparison.push({
            stationCode: st.code,
            stationName: st.name,
            avgGenerationKw: calculateAverage(stReadings.map((r) => r.generationKw)) || 0,
            avgConsumptionKw: calculateAverage(stReadings.map((r) => r.consumptionKw)) || 0,
            avgBatteryPercent: calculateAverage(stReadings.map((r) => r.batteryPercent)) || 0,
            avgFuelPercent: calculateAverage(stReadings.map((r) => r.fuelPercent)) || 0
          });
        }
      }
    }

    return {
      station: stationFilter,
      timeWindow: {
        start: window.currentStart.toISOString(),
        end: window.currentEnd.toISOString()
      },
      metrics: {
        totalGenerationKwh: totalGenKwh,
        avgGenerationKw: avgGenKw,
        peakGenerationKw: peakGenKw,
        totalConsumptionKwh: totalConsKwh,
        avgConsumptionKw: avgConsKw,
        peakConsumptionKw: peakConsKw,
        netPowerKw,
        netEnergyKwh,
        avgBatteryPercent: calculateAverage(batteryPercents),
        minBatteryPercent: roundTo(Math.min(...batteryPercents), 1),
        maxBatteryPercent: roundTo(Math.max(...batteryPercents), 1),
        avgBatteryVoltage: calculateAverage(batteryVoltages),
        avgFuelPercent: calculateAverage(fuelPercents),
        fuelLiters: roundTo(latest.fuelLiters, 0),
        fuelDaysRemaining: roundTo(latest.fuelDaysRemaining, 1),
        solarGenerationKwh: totalSolarKwh,
        solarFractionPercent: solarFraction,
        generatorUtilizationPercent: genUtilization
      },
      timeSeries,
      stationComparison,
      dataQuality
    };
  }
}

export const energyAnalyticsService = new EnergyAnalyticsService();
