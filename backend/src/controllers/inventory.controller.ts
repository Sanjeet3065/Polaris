import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { InventoryStatus, StockMovementType } from "@prisma/client";

export class InventoryController {
  /**
   * GET /api/v1/inventory
   */
  public getInventory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const station = (req.query.station as string) || (req.params.stationId as string);
      const category = req.query.category as string | undefined;
      const status = req.query.status as InventoryStatus | undefined;
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "asc";

      const result = await inventoryService.getInventory({
        page,
        limit,
        station,
        category,
        status,
        search,
        sortBy,
        sortOrder
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
   * GET /api/v1/stations/:stationId/inventory (Phase 2 backward compatibility)
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
      const search = req.query.search as string | undefined;

      const result = await inventoryService.getInventoryByStation(stationId, {
        page,
        limit,
        category,
        status,
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
   * GET /api/v1/inventory/overview
   */
  public getOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const station = (req.query.station as string) || (req.params.stationId as string);
      const overview = await inventoryService.getOverview(station);
      ApiResponse.success(res, overview, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/:id or /api/v1/stations/:stationId/inventory/:itemId
   */
  public getInventoryItemById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id || req.params.itemId, "id");
      const item = await inventoryService.getInventoryItem(id);
      ApiResponse.success(res, item, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/inventory
   */
  public createInventoryItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const stationId = getRouteParam(req.body.stationId || req.params.stationId, "stationId");
      const item = await inventoryService.createInventoryItem(
        {
          ...req.body,
          stationId
        },
        userId
      );
      ApiResponse.success(res, item, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/inventory/:id
   */
  public updateInventoryItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id || req.params.itemId, "id");
      const item = await inventoryService.updateInventoryItem(id, req.body);
      ApiResponse.success(res, item, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/inventory/:id/movements
   */
  public recordMovement = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id || req.params.itemId, "id");
      const userId = (req as any).user?.id;
      const result = await inventoryService.recordStockMovement(id, req.body, userId);
      ApiResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/movements or /api/v1/inventory/:id/movements
   */
  public getMovements = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const rawItemId = req.params.id || req.query.itemId;
      const itemId = rawItemId ? getRouteParam(rawItemId as any) : undefined;
      const rawStation = req.query.station || req.params.stationId;
      const station = rawStation ? getRouteParam(rawStation as any) : undefined;
      const type = req.query.type as StockMovementType | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const result = await inventoryService.getMovements({
        page,
        limit,
        station,
        itemId,
        type,
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

  /**
   * POST /api/v1/inventory/transfer
   */
  public transferStock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const result = await inventoryService.transferStock(req.body, userId);
      ApiResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const inventoryController = new InventoryController();
