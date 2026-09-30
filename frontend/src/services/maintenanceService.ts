import { apiClient } from "../lib/apiClient";
import {
  DetailedPredictionView,
  HealthOverviewStats,
  MaintenancePrediction,
  PredictionFilterState
} from "../types/maintenance.types";
import { ApiResponseEnvelope } from "../types";

export interface CreateWorkOrderData {
  title: string;
  description: string;
  type?: "PREVENTIVE" | "CORRECTIVE" | "INSPECTION" | "EMERGENCY";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  scheduledAt: string;
  assignedTo?: string;
}

export class MaintenanceService {
  private static instance: MaintenanceService;

  private constructor() {}

  public static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }

  /**
   * Retrieves latest predictions across equipment
   */
  public async getPredictions(params: Partial<PredictionFilterState>): Promise<{
    items: MaintenancePrediction[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params.stationId && params.stationId !== "ALL") query.append("stationId", params.stationId);
    if (params.riskBand && params.riskBand !== "ALL") query.append("riskBand", params.riskBand);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());

    const res = await apiClient.get<unknown, ApiResponseEnvelope<MaintenancePrediction[]>>(
      `/maintenance/predictions?${query.toString()}`
    );

    const items = res.data || [];
    const total = res.meta?.total ?? res.pagination?.total ?? items.length;
    const limit = params.limit || 50;

    return {
      items,
      meta: {
        page: res.meta?.page ?? res.pagination?.page ?? 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Retrieves station health summary KPIs
   */
  public async getHealthOverview(stationId?: string): Promise<HealthOverviewStats> {
    const query = stationId && stationId !== "ALL" ? `?stationId=${encodeURIComponent(stationId)}` : "";
    const res = await apiClient.get<unknown, ApiResponseEnvelope<HealthOverviewStats>>(
      `/maintenance/health-overview${query}`
    );
    return res.data;
  }

  /**
   * Retrieves detailed single prediction with historical trends, active alerts, and incidents
   */
  public async getPredictionByEquipmentId(equipmentId: string): Promise<DetailedPredictionView> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<DetailedPredictionView>>(
      `/maintenance/predictions/${encodeURIComponent(equipmentId)}`
    );
    return res.data;
  }

  /**
   * Retrieves historical prediction snapshots for an equipment asset
   */
  public async getPredictionHistory(equipmentId: string, limit = 30): Promise<MaintenancePrediction[]> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<MaintenancePrediction[]>>(
      `/maintenance/predictions/${encodeURIComponent(equipmentId)}/history?limit=${limit}`
    );
    return res.data;
  }

  /**
   * Triggers on-demand recalculation of predictive health
   */
  public async refreshPrediction(equipmentId: string): Promise<MaintenancePrediction> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<MaintenancePrediction>>(
      `/maintenance/predictions/${encodeURIComponent(equipmentId)}/refresh`
    );
    return res.data;
  }

  /**
   * Creates a scheduled maintenance work order
   */
  public async createWorkOrder(
    equipmentId: string,
    data: CreateWorkOrderData
  ): Promise<any> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<any>>(
      `/maintenance/predictions/${encodeURIComponent(equipmentId)}/work-order`,
      data
    );
    return res.data;
  }
}

export const maintenanceService = MaintenanceService.getInstance();
