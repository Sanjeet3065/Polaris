/**
 * POLARIS — Energy & Environmental Telemetry REST API Service
 * Phase 7: Historical Queries & Latest Telemetry Retrieval
 * 
 * Reuses existing Phase 2 endpoints:
 *   - GET /api/v1/stations/:stationId/energy/latest
 *   - GET /api/v1/stations/:stationId/energy (paginated)
 *   - GET /api/v1/stations/:stationId/environment/latest
 *   - GET /api/v1/stations/:stationId/environment (paginated)
 */

import { apiClient } from "../lib/apiClient";
import { ApiResponseEnvelope, StationFilter } from "../types";

export interface EnergyReadingItem {
  id: string;
  stationId: string;
  recordedAt: string;
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
}

export interface EnvironmentalReadingItem {
  id: string;
  stationId: string;
  recordedAt: string;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windDirectionCompass: string;
  visibility: number;
  solarRadiation: number;
  snowfallRate: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface TelemetryHistoryQuery {
  page?: number;
  limit?: number;
  from?: string; // ISO 8601 string
  to?: string;   // ISO 8601 string
}

export interface TelemetryHistoryResult<T> {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export const telemetryService = {
  /**
   * Retrieves latest energy reading for a station
   */
  async getLatestEnergy(stationIdOrCode: string): Promise<EnergyReadingItem> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<EnergyReadingItem>>(
      `/stations/${stationIdOrCode}/energy/latest`
    );
    return res.data;
  },

  /**
   * Retrieves historical energy records for a station
   */
  async getEnergyHistory(
    stationIdOrCode: string,
    query: TelemetryHistoryQuery = {}
  ): Promise<TelemetryHistoryResult<EnergyReadingItem>> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.from) params.append("from", query.from);
    if (query.to) params.append("to", query.to);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<
      unknown,
      ApiResponseEnvelope<EnergyReadingItem[]> & {
        pagination?: { page: number; limit: number; total: number };
      }
    >(`/stations/${stationIdOrCode}/energy${qs}`);

    return {
      items: res.data || [],
      pagination: res.pagination
    };
  },

  /**
   * Retrieves latest environmental reading for a station
   */
  async getLatestEnvironment(stationIdOrCode: string): Promise<EnvironmentalReadingItem> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<EnvironmentalReadingItem>>(
      `/stations/${stationIdOrCode}/environment/latest`
    );
    return res.data;
  },

  /**
   * Retrieves historical environmental records for a station
   */
  async getEnvironmentHistory(
    stationIdOrCode: string,
    query: TelemetryHistoryQuery = {}
  ): Promise<TelemetryHistoryResult<EnvironmentalReadingItem>> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.from) params.append("from", query.from);
    if (query.to) params.append("to", query.to);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<
      unknown,
      ApiResponseEnvelope<EnvironmentalReadingItem[]> & {
        pagination?: { page: number; limit: number; total: number };
      }
    >(`/stations/${stationIdOrCode}/environment${qs}`);

    return {
      items: res.data || [],
      pagination: res.pagination
    };
  },

  /**
   * Fetches history for selectedStation, gracefully handling 'ALL' by aggregating both Maitri and Bharati
   */
  async getCombinedEnergyHistory(
    station: StationFilter,
    query: TelemetryHistoryQuery = {}
  ): Promise<TelemetryHistoryResult<EnergyReadingItem>> {
    if (station === "ALL") {
      const [maitri, bharati] = await Promise.all([
        this.getEnergyHistory("MAITRI", query),
        this.getEnergyHistory("BHARATI", query)
      ]);

      // Combine matching time buckets or sort by recordedAt asc
      const combinedMap = new Map<string, EnergyReadingItem>();
      
      for (const item of maitri.items) {
        const timeKey = item.recordedAt.slice(0, 16); // Minute resolution
        combinedMap.set(timeKey, { ...item });
      }

      for (const item of bharati.items) {
        const timeKey = item.recordedAt.slice(0, 16);
        const existing = combinedMap.get(timeKey);
        if (existing) {
          existing.generationKw = Math.round(existing.generationKw + item.generationKw);
          existing.solarKw = Math.round(existing.solarKw + item.solarKw);
          existing.dieselKw = Math.round(existing.dieselKw + item.dieselKw);
          existing.consumptionKw = Math.round(existing.consumptionKw + item.consumptionKw);
          existing.netPowerKw = Math.round(existing.generationKw - existing.consumptionKw);
          existing.batteryPercent = Math.round((existing.batteryPercent + item.batteryPercent) / 2);
          existing.fuelPercent = Math.round((existing.fuelPercent + item.fuelPercent) / 2);
          existing.fuelLiters = existing.fuelLiters + item.fuelLiters;
        } else {
          combinedMap.set(timeKey, { ...item });
        }
      }

      const sorted = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );

      return {
        items: sorted,
        pagination: {
          page: 1,
          limit: sorted.length,
          total: sorted.length
        }
      };
    }

    const result = await this.getEnergyHistory(station, query);
    // Return in chronological order (asc) for charts
    const sorted = [...result.items].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    return {
      items: sorted,
      pagination: result.pagination
    };
  },

  /**
   * Fetches environmental history for selectedStation, gracefully handling 'ALL'
   */
  async getCombinedEnvironmentHistory(
    station: StationFilter,
    query: TelemetryHistoryQuery = {}
  ): Promise<TelemetryHistoryResult<EnvironmentalReadingItem>> {
    if (station === "ALL") {
      const [maitri, bharati] = await Promise.all([
        this.getEnvironmentHistory("MAITRI", query),
        this.getEnvironmentHistory("BHARATI", query)
      ]);

      const combinedMap = new Map<string, EnvironmentalReadingItem>();

      for (const item of maitri.items) {
        const timeKey = item.recordedAt.slice(0, 16);
        combinedMap.set(timeKey, { ...item });
      }

      for (const item of bharati.items) {
        const timeKey = item.recordedAt.slice(0, 16);
        const existing = combinedMap.get(timeKey);
        if (existing) {
          existing.temperature = Number(((existing.temperature + item.temperature) / 2).toFixed(1));
          existing.humidity = Math.round((existing.humidity + item.humidity) / 2);
          existing.pressure = Math.round((existing.pressure + item.pressure) / 2);
          existing.windSpeed = Math.round(Math.max(existing.windSpeed, item.windSpeed));
          existing.visibility = Number(((existing.visibility + item.visibility) / 2).toFixed(1));
          existing.solarRadiation = Math.round((existing.solarRadiation + item.solarRadiation) / 2);
        } else {
          combinedMap.set(timeKey, { ...item });
        }
      }

      const sorted = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );

      return {
        items: sorted,
        pagination: {
          page: 1,
          limit: sorted.length,
          total: sorted.length
        }
      };
    }

    const result = await this.getEnvironmentHistory(station, query);
    const sorted = [...result.items].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    return {
      items: sorted,
      pagination: result.pagination
    };
  }
};
