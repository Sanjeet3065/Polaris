import { Alert, AlertSeverity, AlertStatus, IncidentCategory, IncidentImpact, IncidentSeverity, IncidentStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { alertRepository, ExtendedAlertFilterOptions, AlertOverviewKpi } from "../repositories/alert.repository";
import { incidentRepository } from "../repositories/incident.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";
import { realtimeService } from "../realtime/realtime.service";
import { REALTIME_EVENT_TYPES } from "../realtime/events/realtime.types";
import { isValidAlertTransition } from "../utils/alertRules";
import { EscalateAlertInput } from "../validators/alert.validator";
import { StationCode } from "../simulator/models/simulator.types";

export interface AlertQuery extends ExtendedAlertFilterOptions {
  page: number;
  limit: number;
}

export class AlertService {
  /**
   * Retrieves paginated alerts for a station (Phase 2 backward compatibility)
   */
  async getAlertsByStation(
    stationIdentifier: string,
    query: { page: number; limit: number; severity?: AlertSeverity; status?: AlertStatus }
  ): Promise<PaginatedResult<Alert>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const [items, total] = await Promise.all([
      alertRepository.findByStationId(station.id, {
        page: query.page,
        limit: query.limit,
        severity: query.severity,
        status: query.status
      }),
      alertRepository.countByStationId(station.id, {
        severity: query.severity,
        status: query.status
      })
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1
      }
    };
  }

  /**
   * General paginated alerts query with full filtering
   */
  async getAlerts(query: AlertQuery): Promise<PaginatedResult<Alert>> {
    let resolvedStationId = query.stationId;
    if (query.stationId && query.stationId !== "ALL") {
      try {
        const station = await stationService.resolveStation(query.stationId);
        resolvedStationId = station.id;
      } catch {
        resolvedStationId = query.stationId;
      }
    }

    const filterOptions: ExtendedAlertFilterOptions = {
      stationId: resolvedStationId,
      severity: query.severity,
      status: query.status,
      sourceType: query.sourceType,
      ruleCode: query.ruleCode,
      search: query.search
    };

    const [items, total] = await Promise.all([
      alertRepository.findMany({
        page: query.page,
        limit: query.limit,
        ...filterOptions
      }),
      alertRepository.count(filterOptions)
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1
      }
    };
  }

  /**
   * Retrieves single alert details
   */
  async getAlertDetails(id: string): Promise<Alert> {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      throw ApiError.notFound(`Alert with ID '${id}' was not found`, "ALERT_NOT_FOUND");
    }
    return alert;
  }

  /**
   * Aggregates Alert KPIs for Station or Global Fleet
   */
  async getAlertsOverview(stationId?: string): Promise<AlertOverviewKpi> {
    let resolvedStationId = stationId;
    if (stationId && stationId !== "ALL") {
      try {
        const station = await stationService.resolveStation(stationId);
        resolvedStationId = station.id;
      } catch {
        resolvedStationId = stationId;
      }
    }
    return await alertRepository.getOverview(resolvedStationId);
  }

  /**
   * Operator acknowledges an alert
   */
  async acknowledgeAlert(
    id: string,
    user: { id: string; name?: string; role?: string }
  ): Promise<Alert> {
    const alert = await this.getAlertDetails(id);

    // Idempotent: If already acknowledged, return gracefully
    if (alert.status === AlertStatus.ACKNOWLEDGED) {
      return alert;
    }

    if (!isValidAlertTransition(alert.status, AlertStatus.ACKNOWLEDGED)) {
      throw ApiError.badRequest(
        `Cannot acknowledge alert in '${alert.status}' state`,
        "INVALID_ALERT_TRANSITION"
      );
    }

    const operatorName = user.name || user.id;

    // Transactional update & audit log
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.ACKNOWLEDGED,
          acknowledgedAt: new Date(),
          acknowledgedBy: operatorName
        },
        include: {
          station: { select: { id: true, code: true, name: true } },
          equipment: { select: { id: true, code: true, name: true } }
        }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: alert.stationId,
          type: "ALERT",
          title: `ALERT_ACKNOWLEDGED: ${alert.title}`,
          description: `Acknowledged by operator ${operatorName}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            alertId: id,
            acknowledgedBy: operatorName,
            previousStatus: alert.status
          })
        }
      });

      return result;
    });

    // Realtime notification
    const stationCode = (updated.station as { code: string }).code as StationCode;
    realtimeService.publishAlertEvent(REALTIME_EVENT_TYPES.ALERT_ACKNOWLEDGED, {
      id: updated.id,
      stationId: updated.stationId,
      stationCode,
      severity: updated.severity,
      status: AlertStatus.ACKNOWLEDGED,
      title: updated.title,
      message: updated.message || updated.description,
      ruleCode: updated.ruleCode || undefined,
      sourceType: updated.sourceType || undefined,
      sourceId: updated.sourceId || undefined,
      occurrenceCount: updated.occurrenceCount,
      acknowledgedBy: operatorName,
      acknowledgedAt: updated.acknowledgedAt?.toISOString(),
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Escalates an alert to an Incident (Transactional)
   */
  async escalateAlert(
    id: string,
    user: { id: string; name?: string; role?: string },
    incidentInput?: EscalateAlertInput
  ) {
    const alert = await this.getAlertDetails(id);

    if (!isValidAlertTransition(alert.status, AlertStatus.ESCALATED)) {
      throw ApiError.badRequest(
        `Cannot escalate alert in '${alert.status}' state`,
        "INVALID_ALERT_TRANSITION"
      );
    }

    const station = await stationService.resolveStation(alert.stationId);
    const stationCode = station.code as StationCode;
    const operatorName = user.name || user.id;

    const nextIncidentNumber = await incidentRepository.generateNextIncidentNumber(stationCode);

    // Map alert severity to incident severity safely
    let incidentSeverity: IncidentSeverity = IncidentSeverity.MEDIUM;
    if (alert.severity === AlertSeverity.CRITICAL) {
      incidentSeverity = IncidentSeverity.CRITICAL;
    } else if (alert.severity === AlertSeverity.HIGH) {
      incidentSeverity = IncidentSeverity.HIGH;
    } else if (alert.severity === AlertSeverity.LOW) {
      incidentSeverity = IncidentSeverity.LOW;
    }

    // Determine Incident category from alert source
    let incidentCategory: IncidentCategory = IncidentCategory.OPERATIONS;
    if (alert.sourceType === "ENERGY") incidentCategory = IncidentCategory.ENERGY;
    else if (alert.sourceType === "ENVIRONMENT") incidentCategory = IncidentCategory.ENVIRONMENT;
    else if (alert.sourceType === "EQUIPMENT") incidentCategory = IncidentCategory.EQUIPMENT;
    else if (alert.sourceType === "INVENTORY") incidentCategory = IncidentCategory.INVENTORY;
    else if (alert.sourceType === "LOGISTICS") incidentCategory = IncidentCategory.LOGISTICS;

    // Transactional Escalation
    const { incident, updatedAlert } = await prisma.$transaction(async (tx) => {
      // 1. Create Incident
      const newIncident = await tx.incident.create({
        data: {
          stationId: alert.stationId,
          incidentNumber: nextIncidentNumber,
          title: incidentInput?.title || `Incident: ${alert.title}`,
          description: incidentInput?.description || alert.message || alert.description,
          severity: incidentInput?.severity || incidentSeverity,
          status: IncidentStatus.OPEN,
          category: incidentInput?.category || incidentCategory,
          impact: incidentInput?.impact || IncidentImpact.MEDIUM,
          assignedTo: incidentInput?.assignedTo || null,
          createdById: user.id,
          source: alert.sourceType || "ALERT_ESCALATION"
        }
      });

      // 2. Link Alert to Incident
      await tx.incidentAlert.create({
        data: {
          incidentId: newIncident.id,
          alertId: id
        }
      });

      // 3. Update Alert Status to ESCALATED
      const resAlert = await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.ESCALATED
        },
        include: {
          station: { select: { id: true, code: true, name: true } },
          equipment: { select: { id: true, code: true, name: true } }
        }
      });

      // 4. Create Audit Logs
      await tx.operationalEvent.create({
        data: {
          stationId: alert.stationId,
          type: "ALERT",
          title: `ALERT_ESCALATED: ${alert.title}`,
          description: `Escalated to Incident ${nextIncidentNumber} by ${operatorName}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            alertId: id,
            incidentId: newIncident.id,
            incidentNumber: nextIncidentNumber,
            escalatedBy: operatorName
          })
        }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: alert.stationId,
          type: "INCIDENT",
          title: `INCIDENT_CREATED: ${newIncident.title}`,
          description: `Spawned from Alert ${id} (${alert.title})`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            incidentId: newIncident.id,
            incidentNumber: nextIncidentNumber,
            originAlertId: id,
            createdBy: operatorName
          })
        }
      });

      return { incident: newIncident, updatedAlert: resAlert };
    });

    // Realtime Notifications
    realtimeService.publishAlertEvent(REALTIME_EVENT_TYPES.ALERT_ESCALATED, {
      id: updatedAlert.id,
      stationId: updatedAlert.stationId,
      stationCode,
      severity: updatedAlert.severity,
      status: AlertStatus.ESCALATED,
      title: updatedAlert.title,
      message: updatedAlert.message || updatedAlert.description,
      ruleCode: updatedAlert.ruleCode || undefined,
      sourceType: updatedAlert.sourceType || undefined,
      occurrenceCount: updatedAlert.occurrenceCount,
      timestamp: new Date().toISOString()
    });

    realtimeService.publishIncidentEvent(REALTIME_EVENT_TYPES.INCIDENT_CREATED, {
      id: incident.id,
      stationId: incident.stationId,
      stationCode,
      incidentNumber: incident.incidentNumber,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      category: incident.category,
      impact: incident.impact,
      assignedTo: incident.assignedTo || undefined,
      startedAt: incident.startedAt.toISOString(),
      timestamp: incident.createdAt.toISOString()
    });

    return { alert: updatedAlert, incident };
  }

  /**
   * Operator resolves an alert
   */
  async resolveAlert(
    id: string,
    user: { id: string; name?: string; role?: string },
    note?: string
  ): Promise<Alert> {
    const alert = await this.getAlertDetails(id);

    // Idempotent: If already resolved, return gracefully
    if (alert.status === AlertStatus.RESOLVED) {
      return alert;
    }

    if (!isValidAlertTransition(alert.status, AlertStatus.RESOLVED)) {
      throw ApiError.badRequest(
        `Cannot resolve alert in '${alert.status}' state`,
        "INVALID_ALERT_TRANSITION"
      );
    }

    const operatorName = user.name || user.id;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedBy: operatorName,
          message: note ? `${alert.message || alert.description} [RESOLVED: ${note}]` : alert.message
        },
        include: {
          station: { select: { id: true, code: true, name: true } },
          equipment: { select: { id: true, code: true, name: true } }
        }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: alert.stationId,
          type: "ALERT",
          title: `ALERT_RESOLVED: ${alert.title}`,
          description: `Resolved by ${operatorName}${note ? `: ${note}` : ""}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            alertId: id,
            resolvedBy: operatorName,
            note
          })
        }
      });

      return result;
    });

    const stationCode = (updated.station as { code: string }).code as StationCode;
    realtimeService.publishAlertEvent(REALTIME_EVENT_TYPES.ALERT_RESOLVED, {
      id: updated.id,
      stationId: updated.stationId,
      stationCode,
      severity: updated.severity,
      status: AlertStatus.RESOLVED,
      title: updated.title,
      message: updated.message || updated.description,
      ruleCode: updated.ruleCode || undefined,
      occurrenceCount: updated.occurrenceCount,
      resolvedBy: operatorName,
      resolvedAt: updated.resolvedAt?.toISOString(),
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Operator suppresses an alert with mandatory reason
   */
  async suppressAlert(
    id: string,
    user: { id: string; name?: string; role?: string },
    reason: string
  ): Promise<Alert> {
    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest(
        "A valid reason (minimum 3 characters) is required to suppress an alert",
        "INVALID_SUPPRESSION_REASON"
      );
    }

    const alert = await this.getAlertDetails(id);

    if (!isValidAlertTransition(alert.status, AlertStatus.SUPPRESSED)) {
      throw ApiError.badRequest(
        `Cannot suppress alert in '${alert.status}' state`,
        "INVALID_ALERT_TRANSITION"
      );
    }

    const operatorName = user.name || user.id;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.SUPPRESSED,
          suppressedAt: new Date(),
          suppressedBy: operatorName,
          message: `${alert.message || alert.description} [SUPPRESSED: ${reason}]`
        },
        include: {
          station: { select: { id: true, code: true, name: true } },
          equipment: { select: { id: true, code: true, name: true } }
        }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: alert.stationId,
          type: "ALERT",
          title: `ALERT_SUPPRESSED: ${alert.title}`,
          description: `Suppressed by ${operatorName}: ${reason}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            alertId: id,
            suppressedBy: operatorName,
            reason
          })
        }
      });

      return result;
    });

    const stationCode = (updated.station as { code: string }).code as StationCode;
    realtimeService.publishAlertEvent(REALTIME_EVENT_TYPES.ALERT_SUPPRESSED, {
      id: updated.id,
      stationId: updated.stationId,
      stationCode,
      severity: updated.severity,
      status: AlertStatus.SUPPRESSED,
      title: updated.title,
      message: updated.message || updated.description,
      ruleCode: updated.ruleCode || undefined,
      occurrenceCount: updated.occurrenceCount,
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Retrieves operational timeline for this alert
   */
  async getAlertTimeline(id: string) {
    await this.getAlertDetails(id);
    return await alertRepository.getTimeline(id);
  }
}

export const alertService = new AlertService();
