import { Request, Response, NextFunction } from "express";
import { incidentService } from "../services/incident.service";
import { ApiResponse } from "../utils/apiResponse";
import { getRouteParam } from "../utils/requestParams";
import { IncidentCategory, IncidentImpact, IncidentSeverity, IncidentStatus } from "@prisma/client";

export class IncidentController {
  /**
   * GET /api/v1/incidents
   */
  public getIncidents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const stationId = req.query.stationId as string | undefined;
      const status = req.query.status as IncidentStatus | undefined;
      const severity = req.query.severity as IncidentSeverity | undefined;
      const category = req.query.category as IncidentCategory | undefined;
      const assignedTo = req.query.assignedTo as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await incidentService.getIncidents({
        page,
        limit,
        stationId,
        status,
        severity,
        category,
        assignedTo,
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
   * GET /api/v1/incidents/overview
   */
  public getIncidentsOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stationId = req.query.stationId as string | undefined;
      const kpis = await incidentService.getIncidentsOverview(stationId);
      ApiResponse.success(res, kpis, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/incidents/:id
   */
  public getIncidentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const incident = await incidentService.getIncidentDetails(id);
      ApiResponse.success(res, incident, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/incidents
   */
  public createIncident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const incident = await incidentService.createIncident(req.body, user);
      ApiResponse.success(res, incident, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/incidents/:id
   */
  public updateIncident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const updated = await incidentService.updateIncident(id, req.body, user);
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/incidents/:id/status
   */
  public updateIncidentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const { status, note, resolutionSummary } = req.body;

      const updated = await incidentService.updateIncidentStatus(
        id,
        status,
        user,
        note,
        resolutionSummary
      );
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/incidents/:id/assign
   */
  public assignIncident = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const { assignedTo } = req.body;

      const updated = await incidentService.assignIncident(id, assignedTo, user);
      ApiResponse.success(res, updated, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/incidents/:id/notes
   */
  public addIncidentNote = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const { content } = req.body;

      const note = await incidentService.addIncidentNote(id, content, user);
      ApiResponse.success(res, note, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/incidents/:id/alerts
   */
  public linkAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const user = req.user || { id: "SYSTEM", name: "Operator" };
      const { alertId } = req.body;

      const result = await incidentService.linkAlert(id, alertId, user);
      ApiResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/incidents/:id/alerts/:alertId
   */
  public unlinkAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const alertId = getRouteParam(req.params.alertId, "alertId");
      const user = req.user || { id: "SYSTEM", name: "Operator" };

      const result = await incidentService.unlinkAlert(id, alertId, user);
      ApiResponse.success(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/incidents/:id/timeline
   */
  public getIncidentTimeline = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params.id, "id");
      const events = await incidentService.getIncidentTimeline(id);
      ApiResponse.success(res, events, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const incidentController = new IncidentController();
