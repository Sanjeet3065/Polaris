import { Request, Response, NextFunction } from "express";
import { environmentService } from "../services/environment.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";

export class EnvironmentController {
  /**
   * GET /api/v1/stations/:stationId/environment/latest
   */
  public getLatestEnvironment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const reading = await environmentService.getLatestEnvironment(stationId);
      ApiResponse.success(res, reading, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/stations/:stationId/environment
   */
  public getEnvironmentalHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const result = await environmentService.getEnvironmentalHistory(stationId, {
        page,
        limit,
        from,
        to
      });

      ApiResponse.success(res, result.items, 200, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total
      });
    } catch (error) {
      next(error);
    }
  };
}

export const environmentController = new EnvironmentController();
