import { Request, Response, NextFunction } from "express";
import { predictiveMaintenanceService } from "../services/predictiveMaintenance.service";
import { ApiResponse } from "../utils/apiResponse";
import { RiskBand } from "@prisma/client";

export class PredictiveMaintenanceController {
  /**
   * GET /api/v1/maintenance/predictions
   */
  public getPredictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stationId = req.query.stationId as string | undefined;
      const riskBand = req.query.riskBand as RiskBand | undefined;
      const search = req.query.search as string | undefined;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      const result = await predictiveMaintenanceService.getPredictions({
        stationId,
        riskBand,
        search,
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

  /**
   * GET /api/v1/maintenance/health-overview
   */
  public getHealthOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stationId = req.query.stationId as string | undefined;
      const overview = await predictiveMaintenanceService.getHealthOverview(stationId);
      ApiResponse.success(res, overview, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/maintenance/predictions/:equipmentId
   */
  public getPredictionByEquipmentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const equipmentId = req.params.equipmentId as string;
      const detailed = await predictiveMaintenanceService.getPredictionByEquipmentId(equipmentId);
      ApiResponse.success(res, detailed, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/maintenance/predictions/:equipmentId/history
   */
  public getPredictionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const equipmentId = req.params.equipmentId as string;
      const limit = Number(req.query.limit) || 30;
      const history = await predictiveMaintenanceService.getPredictionHistory(equipmentId, limit);
      ApiResponse.success(res, history, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/maintenance/predictions/:equipmentId/explanation
   */
  public getExplanation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const equipmentId = req.params.equipmentId as string;
      const detailed = await predictiveMaintenanceService.getPredictionByEquipmentId(equipmentId);
      ApiResponse.success(res, {
        equipmentId,
        equipmentCode: detailed.equipment.code,
        healthScore: detailed.prediction.healthScore,
        riskScore: detailed.prediction.riskScore,
        riskBand: detailed.prediction.riskBand,
        rul: {
          hours: detailed.prediction.estimatedRulHours,
          days: detailed.prediction.estimatedRulDays
        },
        confidence: detailed.prediction.confidence,
        dataQuality: detailed.prediction.dataQuality,
        topFactors: JSON.parse(detailed.prediction.topFactors),
        recommendation: detailed.prediction.recommendation,
        modelName: detailed.prediction.modelName,
        modelVersion: detailed.prediction.modelVersion,
        generatedAt: detailed.prediction.generatedAt
      }, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/maintenance/predictions/:equipmentId/refresh
   */
  public refreshPrediction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const equipmentId = req.params.equipmentId as string;
      const userId = (req as any).user?.id || (req as any).user?.username || "OPERATOR";
      const updated = await predictiveMaintenanceService.refreshPrediction(equipmentId, userId);
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/maintenance/predictions/:equipmentId/work-order
   */
  public createWorkOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const equipmentId = req.params.equipmentId as string;
      const userId = (req as any).user?.id || (req as any).user?.username || "OPERATOR";
      const workOrder = await predictiveMaintenanceService.createWorkOrder(equipmentId, req.body, userId);
      ApiResponse.success(res, workOrder, 201);
    } catch (error) {
      next(error);
    }
  };
}

export const predictiveMaintenanceController = new PredictiveMaintenanceController();
