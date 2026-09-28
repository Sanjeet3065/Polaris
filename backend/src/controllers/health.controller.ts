import { Request, Response, NextFunction } from "express";
import { healthService } from "../services/health.service";
import { ApiResponse } from "../utils/apiResponse";

export class HealthController {
  public getHealth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const health = healthService.getSystemHealth();
      ApiResponse.success(res, health);
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
