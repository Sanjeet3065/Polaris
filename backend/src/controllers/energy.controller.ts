import { Request, Response, NextFunction } from "express";
import { energyService } from "../services/energy.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";

export class EnergyController {
  /**
   * GET /api/v1/stations/:stationId/energy/latest
   */
  public getLatestEnergy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const reading = await energyService.getLatestEnergy(stationId);
      ApiResponse.success(res, reading, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/stations/:stationId/energy
   */
  public getEnergyHistory = async (
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

      const result = await energyService.getEnergyHistory(stationId, {
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

export const energyController = new EnergyController();
