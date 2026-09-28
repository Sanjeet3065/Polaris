import { Request, Response, NextFunction } from "express";
import { alertService } from "../services/alert.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { AlertSeverity, AlertStatus } from "@prisma/client";

export class AlertController {
  /**
   * GET /api/v1/stations/:stationId/alerts
   */
  public getStationAlerts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const severity = req.query.severity as AlertSeverity | undefined;
      const status = req.query.status as AlertStatus | undefined;

      const result = await alertService.getAlertsByStation(stationId, {
        page,
        limit,
        severity,
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
   * GET /api/v1/stations/:stationId/alerts/:alertId
   */
  public getAlertById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const alertId = getRouteParam(req.params.alertId, "alertId");
      const alert = await alertService.getAlertDetails(alertId);
      ApiResponse.success(res, alert, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const alertController = new AlertController();
