import { Request, Response, NextFunction } from "express";
import { healthService } from "../services/health.service";
import { ApiResponse } from "../utils/apiResponse";

export class HealthController {
  public getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await healthService.getSystemHealth();
      const statusCode = health.status === "healthy" ? 200 : 503;
      ApiResponse.success(res, health, statusCode);
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
