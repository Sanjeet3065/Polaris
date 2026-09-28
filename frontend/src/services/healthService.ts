import { apiClient } from "../lib/apiClient";
import { ApiResponseEnvelope } from "../types";

export interface HealthData {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptimeSeconds?: number;
  environment?: string;
}

export const healthService = {
  async getBackendHealth(): Promise<HealthData> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<HealthData>>("/health");
    return res.data;
  },

  async getAiServiceHealth(): Promise<{ service: string; status: string; version: string; timestamp: string }> {
    const aiUrl = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${aiUrl}/health`);
    if (!response.ok) {
      throw new Error("AI service health check failed");
    }
    return response.json();
  }
};
