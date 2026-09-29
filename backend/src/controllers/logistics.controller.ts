import { Request, Response, NextFunction } from "express";
import { logisticsService } from "../services/logistics.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { ShipmentPriority, ShipmentStatus } from "@prisma/client";

export class LogisticsController {
  /**
   * GET /api/v1/logistics
   */
  public getShipments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const station = (req.query.station as string) || (req.query.destinationStation as string);
      const status = req.query.status as ShipmentStatus | undefined;
      const priority = req.query.priority as ShipmentPriority | undefined;
      const search = req.query.search as string | undefined;

      const result = await logisticsService.getShipments({
        page,
        limit,
        station,
        status,
        priority,
        search
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
   * GET /api/v1/logistics/overview
   */
  public getOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const station = req.query.station as string | undefined;
      const overview = await logisticsService.getOverview(station);
      ApiResponse.success(res, overview, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/logistics/:id
   */
  public getShipmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const shipment = await logisticsService.getShipmentById(id);
      ApiResponse.success(res, shipment, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/logistics
   */
  public createShipment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const shipment = await logisticsService.createShipment(req.body, userId);
      ApiResponse.success(res, shipment, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/logistics/:id or /api/v1/logistics/:id/status
   */
  public updateShipmentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const userId = (req as any).user?.id;
      const updated = await logisticsService.updateShipmentStatus(id, req.body, userId);
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/logistics/:id/receive
   */
  public receiveShipmentCargo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const userId = (req as any).user?.id;
      const result = await logisticsService.receiveShipmentCargo(id, req.body, userId);
      ApiResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const logisticsController = new LogisticsController();
