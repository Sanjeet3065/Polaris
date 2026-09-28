import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";

export class EventController {
  /**
   * GET /api/v1/stations/:stationId/events
   */
  public getStationEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const type = req.query.type as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const result = await eventService.getEventsByStation(stationId, {
        page,
        limit,
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
}

export const eventController = new EventController();
