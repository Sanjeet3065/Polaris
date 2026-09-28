import { Request, Response, NextFunction } from "express";
import { equipmentService } from "../services/equipment.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { EquipmentCategory, EquipmentStatus } from "@prisma/client";

export class EquipmentController {
  /**
   * GET /api/v1/stations/:stationId/equipment
   */
  public getStationEquipment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const category = req.query.category as EquipmentCategory | undefined;
      const status = req.query.status as EquipmentStatus | undefined;

      const result = await equipmentService.getEquipmentByStation(stationId, {
        page,
        limit,
        category,
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
   * GET /api/v1/stations/:stationId/equipment/:equipmentId
   */
  public getEquipmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const equipmentId = getRouteParam(req.params.equipmentId, "equipmentId");
      const equipment = await equipmentService.getEquipmentDetails(equipmentId);
      ApiResponse.success(res, equipment, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/stations/:stationId/equipment/:equipmentId/health
   */
  public getEquipmentHealth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const equipmentId = getRouteParam(req.params.equipmentId, "equipmentId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      const result = await equipmentService.getEquipmentHealthHistory(equipmentId, {
        page,
        limit
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

export const equipmentController = new EquipmentController();
