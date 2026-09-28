import { Request, Response, NextFunction } from "express";
import { stationService } from "../services/station.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";

export class StationController {
  /**
   * GET /api/v1/stations
   */
  public getStations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stations = await stationService.getAllStations();
      ApiResponse.success(res, stations, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/stations/:stationId
   */
  public getStationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = getRouteParam(req.params.stationId, "stationId");
      const station = await stationService.getStationByIdOrCode(stationId);
      ApiResponse.success(res, station, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const stationController = new StationController();
