import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { InventoryStatus } from "@prisma/client";

export class InventoryController {
  /**
   * GET /api/v1/stations/:stationId/inventory
   */
  public getStationInventory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const category = req.query.category as string | undefined;
      const status = req.query.status as InventoryStatus | undefined;

      const result = await inventoryService.getInventoryByStation(stationId, {
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
   * GET /api/v1/stations/:stationId/inventory/:itemId
   */
  public getInventoryItemById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const itemId = getRouteParam(req.params.itemId, "itemId");
      const item = await inventoryService.getInventoryItem(itemId);
      ApiResponse.success(res, item, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const inventoryController = new InventoryController();
