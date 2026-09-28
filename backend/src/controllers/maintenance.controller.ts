import { Request, Response, NextFunction } from "express";
import { maintenanceService } from "../services/maintenance.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { MaintenanceStatus } from "@prisma/client";

export class MaintenanceController {
  /**
   * GET /api/v1/stations/:stationId/maintenance
   */
  public getStationMaintenance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const status = req.query.status as MaintenanceStatus | undefined;

      const result = await maintenanceService.getMaintenanceByStation(stationId, {
        page,
        limit,
        status
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

  /**
   * GET /api/v1/stations/:stationId/maintenance/:recordId
   */
  public getMaintenanceRecordById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const recordId = getRouteParam(req.params.recordId, "recordId");
      const record = await maintenanceService.getMaintenanceRecord(recordId);
      ApiResponse.success(res, record, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const maintenanceController = new MaintenanceController();
