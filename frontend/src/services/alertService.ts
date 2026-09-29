import { apiClient } from "../lib/apiClient";
import {
  Alert,
  AlertOverviewKpi,
  Incident,
  IncidentNote,
  IncidentOverviewKpi
} from "../types/alert.types";
import {
  AlertSeverity,
  AlertStatus,
  IncidentCategory,
  IncidentImpact,
  IncidentSeverity,
  IncidentStatus
} from "../utils/alertRules";
import { ApiResponseEnvelope, StationFilter } from "../types";

export interface AlertQueryParams {
  page?: number;
  limit?: number;
  stationId?: StationFilter | string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  sourceType?: string;
  ruleCode?: string;
  search?: string;
}

export interface IncidentQueryParams {
  page?: number;
  limit?: number;
  stationId?: StationFilter | string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  assignedTo?: string;
  search?: string;
}

export interface CreateAlertData {
  stationId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  sourceType?: string;
  sourceId?: string;
  equipmentId?: string;
  ruleCode?: string;
  triggerValue?: number;
  thresholdValue?: number;
  unit?: string;
}

export interface CreateIncidentData {
  stationId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  impact?: IncidentImpact;
  assignedTo?: string;
  alertIds?: string[];
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  impact?: IncidentImpact;
  rootCause?: string;
  resolutionSummary?: string;
}

export interface EscalateAlertData {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  impact?: IncidentImpact;
  assignedTo?: string;
}

export const alertService = {
  // ==========================================
  // ALERTS ENDPOINTS
  // ==========================================

  async getAlertsOverview(stationId?: StationFilter | string): Promise<AlertOverviewKpi> {
    const params: Record<string, string> = {};
    if (stationId && stationId !== "ALL") {
      params.stationId = stationId;
    }
    const response = await apiClient.get<ApiResponseEnvelope<AlertOverviewKpi>>(
      "/api/v1/alerts/overview",
      { params }
    );
    return response.data.data;
  },

  async getAlerts(
    params: AlertQueryParams = {}
  ): Promise<{ items: Alert[]; pagination: { page: number; limit: number; total: number } }> {
    const query: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 20
    };
    if (params.stationId && params.stationId !== "ALL") query.stationId = params.stationId;
    if (params.severity) query.severity = params.severity;
    if (params.status) query.status = params.status;
    if (params.sourceType) query.sourceType = params.sourceType;
    if (params.ruleCode) query.ruleCode = params.ruleCode;
    if (params.search) query.search = params.search;

    const response = await apiClient.get<ApiResponseEnvelope<Alert[]>>("/api/v1/alerts", {
      params: query
    });
    return {
      items: response.data.data,
      pagination: {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 20,
        total: response.data.pagination?.total || 0
      }
    };
  },

  async getAlertById(id: string): Promise<Alert> {
    const response = await apiClient.get<ApiResponseEnvelope<Alert>>(`/api/v1/alerts/${id}`);
    return response.data.data;
  },

  async createAlert(data: CreateAlertData): Promise<Alert> {
    const response = await apiClient.post<ApiResponseEnvelope<Alert>>("/api/v1/alerts", data);
    return response.data.data;
  },

  async acknowledgeAlert(id: string, note?: string): Promise<Alert> {
    const response = await apiClient.post<ApiResponseEnvelope<Alert>>(
      `/api/v1/alerts/${id}/acknowledge`,
      { note }
    );
    return response.data.data;
  },

  async escalateAlert(id: string, data?: EscalateAlertData): Promise<{ alert: Alert; incident: Incident }> {
    const response = await apiClient.post<ApiResponseEnvelope<{ alert: Alert; incident: Incident }>>(
      `/api/v1/alerts/${id}/escalate`,
      data || {}
    );
    return response.data.data;
  },

  async resolveAlert(id: string, note?: string): Promise<Alert> {
    const response = await apiClient.post<ApiResponseEnvelope<Alert>>(
      `/api/v1/alerts/${id}/resolve`,
      { note }
    );
    return response.data.data;
  },

  async suppressAlert(id: string, reason: string): Promise<Alert> {
    const response = await apiClient.post<ApiResponseEnvelope<Alert>>(
      `/api/v1/alerts/${id}/suppress`,
      { reason }
    );
    return response.data.data;
  },

  async getAlertTimeline(id: string): Promise<Array<{ id: string; type: string; title: string; description: string; occurredAt: string }>> {
    const response = await apiClient.get<ApiResponseEnvelope<Array<{ id: string; type: string; title: string; description: string; occurredAt: string }>>>(
      `/api/v1/alerts/${id}/timeline`
    );
    return response.data.data;
  },

  // ==========================================
  // INCIDENTS ENDPOINTS
  // ==========================================

  async getIncidentsOverview(stationId?: StationFilter | string): Promise<IncidentOverviewKpi> {
    const params: Record<string, string> = {};
    if (stationId && stationId !== "ALL") {
      params.stationId = stationId;
    }
    const response = await apiClient.get<ApiResponseEnvelope<IncidentOverviewKpi>>(
      "/api/v1/incidents/overview",
      { params }
    );
    return response.data.data;
  },

  async getIncidents(
    params: IncidentQueryParams = {}
  ): Promise<{ items: Incident[]; pagination: { page: number; limit: number; total: number } }> {
    const query: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 20
    };
    if (params.stationId && params.stationId !== "ALL") query.stationId = params.stationId;
    if (params.status) query.status = params.status;
    if (params.severity) query.severity = params.severity;
    if (params.category) query.category = params.category;
    if (params.assignedTo) query.assignedTo = params.assignedTo;
    if (params.search) query.search = params.search;

    const response = await apiClient.get<ApiResponseEnvelope<Incident[]>>("/api/v1/incidents", {
      params: query
    });
    return {
      items: response.data.data,
      pagination: {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 20,
        total: response.data.pagination?.total || 0
      }
    };
  },

  async getIncidentById(id: string): Promise<Incident> {
    const response = await apiClient.get<ApiResponseEnvelope<Incident>>(`/api/v1/incidents/${id}`);
    return response.data.data;
  },

  async createIncident(data: CreateIncidentData): Promise<Incident> {
    const response = await apiClient.post<ApiResponseEnvelope<Incident>>("/api/v1/incidents", data);
    return response.data.data;
  },

  async updateIncident(id: string, data: UpdateIncidentData): Promise<Incident> {
    const response = await apiClient.patch<ApiResponseEnvelope<Incident>>(
      `/api/v1/incidents/${id}`,
      data
    );
    return response.data.data;
  },

  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    note?: string,
    resolutionSummary?: string
  ): Promise<Incident> {
    const response = await apiClient.post<ApiResponseEnvelope<Incident>>(
      `/api/v1/incidents/${id}/status`,
      { status, note, resolutionSummary }
    );
    return response.data.data;
  },

  async assignIncident(id: string, assignedTo: string): Promise<Incident> {
    const response = await apiClient.post<ApiResponseEnvelope<Incident>>(
      `/api/v1/incidents/${id}/assign`,
      { assignedTo }
    );
    return response.data.data;
  },

  async addIncidentNote(id: string, content: string): Promise<IncidentNote> {
    const response = await apiClient.post<ApiResponseEnvelope<IncidentNote>>(
      `/api/v1/incidents/${id}/notes`,
      { content }
    );
    return response.data.data;
  },

  async linkAlert(id: string, alertId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<ApiResponseEnvelope<{ success: boolean }>>(
      `/api/v1/incidents/${id}/alerts`,
      { alertId }
    );
    return response.data.data;
  },

  async unlinkAlert(id: string, alertId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiResponseEnvelope<{ success: boolean }>>(
      `/api/v1/incidents/${id}/alerts/${alertId}`
    );
    return response.data.data;
  },

  async getIncidentTimeline(id: string): Promise<Array<{ id: string; type: string; title: string; description: string; occurredAt: string }>> {
    const response = await apiClient.get<ApiResponseEnvelope<Array<{ id: string; type: string; title: string; description: string; occurredAt: string }>>>(
      `/api/v1/incidents/${id}/timeline`
    );
    return response.data.data;
  }
};
