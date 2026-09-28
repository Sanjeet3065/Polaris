import { HealthStatusResponse, DatabaseHealthInfo } from "../types/health.types";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

export class HealthService {
  private startTime: number = Date.now();

  public async getSystemHealth(): Promise<HealthStatusResponse> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    let dbStatus: DatabaseHealthInfo = { status: "DOWN" };
    let isDbHealthy = false;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      dbStatus = { status: "UP", latencyMs };
      isDbHealthy = true;
    } catch {
      dbStatus = { status: "DOWN" };
      isDbHealthy = false;
    }

    return {
      service: "polaris-backend",
      status: isDbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      uptimeSeconds,
      environment: env.NODE_ENV,
      database: dbStatus
    };
  }
}

export const healthService = new HealthService();
