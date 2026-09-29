import { Request, Response, NextFunction } from "express";
import { alertService } from "../services/alert.service";
import { alertEvaluationService } from "../services/alertEvaluation.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { AlertSeverity, AlertStatus } from "@prisma/client";
import { StationCode } from "../simulator/models/simulator.types";

export class AlertController {
  /**
   * GET /api/v1/alerts
   */
  public getAlerts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const stationId = req.query.stationId as string | undefined;
      const severity = req.query.severity as AlertSeverity | undefined;
      const status = req.query.status as AlertStatus | undefined;
      const sourceType = req.query.sourceType as string | undefined;
      const ruleCode = req.query.ruleCode as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await alertService.getAlerts({
        page,
        limit,
        stationId,
        severity,
        status,
        sourceType,
        ruleCode,
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
   * GET /api/v1/alerts/overview
   */
  public getAlertsOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = req.query.stationId as string | undefined;
      const kpis = await alertService.getAlertsOverview(stationId);
      ApiResponse.success(res, kpis, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/stations/:stationId/alerts (Phase 2 compatibility)
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
   * GET /api/v1/alerts/:id or /api/v1/stations/:stationId/alerts/:alertId
   */
  public getAlertById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const alertId = getRouteParam(req.params.alertId || req.params.id, "alertId");
      const alert = await alertService.getAlertDetails(alertId);
      ApiResponse.success(res, alert, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/alerts (Manual or operational alert creation)
   */
  public createAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        stationId,
        severity,
        title,
        message,
        sourceType,
        sourceId,
        equipmentId,
        ruleCode,
        triggerValue,
        thresholdValue,
        unit,
        metadata
      } = req.body;

      const result = await alertEvaluationService.upsertAlert({
        stationId,
        stationCode: "MAITRI" as StationCode,
        severity,
        title,
        message,
        sourceType: sourceType || "OPERATIONAL",
        sourceId,
        equipmentId,
        ruleCode: ruleCode || "OPERATOR_MANUAL_ALERT",
        triggerValue,
        thresholdValue,
        unit,
        metadata: typeof metadata === "object" ? JSON.stringify(metadata) : metadata
      });

      ApiResponse.success(res, result.alert, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/alerts/:id/acknowledge
   */
  public acknowledgeAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const updated = await alertService.acknowledgeAlert(id, user);
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/alerts/:id/escalate
   */
  public escalateAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const { title, description, severity, category, impact, assignedTo } = req.body;

      const result = await alertService.escalateAlert(id, user, {
        title,
        description,
        severity,
        category,
        impact,
        assignedTo
      });

      ApiResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/alerts/:id/resolve
   */
  public resolveAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const { note } = req.body;

      const updated = await alertService.resolveAlert(id, user, note);
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/alerts/:id/suppress
   */
  public suppressAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const { reason } = req.body;

      const updated = await alertService.suppressAlert(id, user, reason);
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/alerts/:id/timeline
   */
  public getAlertTimeline = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const events = await alertService.getAlertTimeline(id);
      ApiResponse.success(res, events, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const alertController = new AlertController();
