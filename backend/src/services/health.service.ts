import { HealthStatusResponse } from "../types/health.types";
import { env } from "../config/env";

export class HealthService {
  private startTime: number = Date.now();

  public getSystemHealth(): HealthStatusResponse {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      service: "polaris-backend",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      uptimeSeconds,
      environment: env.NODE_ENV
    };
  }
}

export const healthService = new HealthService();
