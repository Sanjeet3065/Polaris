export interface HealthStatusResponse {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptimeSeconds?: number;
  environment?: string;
}
