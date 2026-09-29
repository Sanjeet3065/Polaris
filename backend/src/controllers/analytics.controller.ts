import { Request, Response, NextFunction } from "express";
import { analyticsService } from "../services/analytics/analytics.service";
import { energyAnalyticsService } from "../services/analytics/energyAnalytics.service";
import { environmentAnalyticsService } from "../services/analytics/environmentAnalytics.service";
import { equipmentAnalyticsService } from "../services/analytics/equipmentAnalytics.service";
import { maintenanceAnalyticsService } from "../services/analytics/maintenanceAnalytics.service";
import { alertAnalyticsService } from "../services/analytics/alertAnalytics.service";
import { incidentAnalyticsService } from "../services/analytics/incidentAnalytics.service";
import { logisticsAnalyticsService } from "../services/analytics/logisticsAnalytics.service";
import { stationComparisonService } from "../services/analytics/stationComparison.service";
import { ApiResponse } from "../utils/apiResponse";

export class AnalyticsController {
  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getOverview(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getEnergy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await energyAnalyticsService.getEnergyAnalytics(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getEnvironment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await environmentAnalyticsService.getEnvironmentAnalytics(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getEquipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await equipmentAnalyticsService.getEquipmentAnalytics(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await maintenanceAnalyticsService.getMaintenanceAnalytics(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await alertAnalyticsService.getAlertAnalytics(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await incidentAnalyticsService.getIncidentAnalytics(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getLogistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await logisticsAnalyticsService.getLogisticsAnalytics(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };

  public getStationComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await stationComparisonService.getStationComparison(req.query as any);
      ApiResponse.success(res, data, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
