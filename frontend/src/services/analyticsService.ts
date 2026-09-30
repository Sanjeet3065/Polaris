import { apiClient } from "../lib/apiClient";
import { ApiResponseEnvelope } from "../types";
import {
  AlertAnalyticsData,
  EnergyAnalyticsData,
  EnvironmentAnalyticsData,
  EquipmentAnalyticsData,
  IncidentAnalyticsData,
  LogisticsAnalyticsData,
  MaintenanceAnalyticsData,
  OverviewAnalyticsData,
  StationComparisonData,
  TimeRangeOption
} from "../types/analytics.types";

export interface AnalyticsFilterQuery {
  stationId?: string;
  timeRange?: TimeRangeOption;
  startDate?: string;
  endDate?: string;
  category?: string;
}

function buildQuery(params?: AnalyticsFilterQuery): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.stationId && params.stationId !== "ALL") q.append("stationId", params.stationId);
  if (params.timeRange) q.append("timeRange", params.timeRange);
  if (params.startDate) q.append("startDate", params.startDate);
  if (params.endDate) q.append("endDate", params.endDate);
  if (params.category && params.category !== "ALL") q.append("category", params.category);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async getOverview(filters?: AnalyticsFilterQuery): Promise<OverviewAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<OverviewAnalyticsData>>(
      `/analytics/overview${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getEnergy(filters?: AnalyticsFilterQuery): Promise<EnergyAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<EnergyAnalyticsData>>(
      `/analytics/energy${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getEnvironment(filters?: AnalyticsFilterQuery): Promise<EnvironmentAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<EnvironmentAnalyticsData>>(
      `/analytics/environment${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getEquipment(filters?: AnalyticsFilterQuery): Promise<EquipmentAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<EquipmentAnalyticsData>>(
      `/analytics/equipment${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getMaintenance(filters?: AnalyticsFilterQuery): Promise<MaintenanceAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<MaintenanceAnalyticsData>>(
      `/analytics/maintenance${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getAlerts(filters?: AnalyticsFilterQuery): Promise<AlertAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<AlertAnalyticsData>>(
      `/analytics/alerts${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getIncidents(filters?: AnalyticsFilterQuery): Promise<IncidentAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<IncidentAnalyticsData>>(
      `/analytics/incidents${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getLogistics(filters?: AnalyticsFilterQuery): Promise<LogisticsAnalyticsData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<LogisticsAnalyticsData>>(
      `/analytics/logistics${buildQuery(filters)}`
    );
    return res.data;
  }

  public async getStationComparison(filters?: AnalyticsFilterQuery): Promise<StationComparisonData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<StationComparisonData>>(
      `/analytics/stations${buildQuery(filters)}`
    );
    return res.data;
  }
}

export const analyticsService = AnalyticsService.getInstance();
