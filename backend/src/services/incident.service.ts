import { Incident, IncidentStatus, IncidentSeverity, IncidentCategory, IncidentImpact, IncidentNote } from "@prisma/client";
import { prisma } from "../config/prisma";
import { incidentRepository, IncidentFilterOptions, IncidentOverviewKpi } from "../repositories/incident.repository";
import { alertRepository } from "../repositories/alert.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";
import { realtimeService } from "../realtime/realtime.service";
import { REALTIME_EVENT_TYPES } from "../realtime/events/realtime.types";
import { isValidIncidentTransition } from "../utils/alertRules";
import { CreateIncidentInput, UpdateIncidentInput } from "../validators/alert.validator";
import { StationCode } from "../simulator/models/simulator.types";

export interface IncidentQuery extends IncidentFilterOptions {
  page: number;
  limit: number;
}

export class IncidentService {
  /**
   * Retrieves paginated incidents with multi-field filtering
   */
  async getIncidents(query: IncidentQuery): Promise<PaginatedResult<Incident>> {
    let resolvedStationId = query.stationId;
    if (query.stationId && query.stationId !== "ALL") {
      try {
        const station = await stationService.resolveStation(query.stationId);
        resolvedStationId = station.id;
      } catch {
        resolvedStationId = query.stationId;
      }
    }

    const filterOptions: IncidentFilterOptions = {
      stationId: resolvedStationId,
      status: query.status,
      severity: query.severity,
      category: query.category,
      assignedTo: query.assignedTo,
      search: query.search
    };

    const [items, total] = await Promise.all([
      incidentRepository.findMany({
        page: query.page,
        limit: query.limit,
        ...filterOptions
      }),
      incidentRepository.count(filterOptions)
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
   * Retrieves incident details with relations, alerts, and notes
   */
  async getIncidentDetails(id: string): Promise<Incident> {
    const incident = await incidentRepository.findById(id);
    if (!incident) {
      throw ApiError.notFound(`Incident with ID '${id}' was not found`, "INCIDENT_NOT_FOUND");
    }
    return incident;
  }

  /**
   * Aggregates Incident KPIs for Station or Global Fleet
   */
  async getIncidentsOverview(stationId?: string): Promise<IncidentOverviewKpi> {
    let resolvedStationId = stationId;
    if (stationId && stationId !== "ALL") {
      try {
        const station = await stationService.resolveStation(stationId);
        resolvedStationId = station.id;
      } catch {
        resolvedStationId = stationId;
      }
    }
    return await incidentRepository.getOverview(resolvedStationId);
  }

  /**
   * Creates a new Incident manually or from escalation
   */
  async createIncident(
    input: CreateIncidentInput,
    user: { id: string; name?: string; role?: string }
  ): Promise<Incident> {
    const station = await stationService.resolveStation(input.stationId);
    const stationCode = station.code as StationCode;
    const operatorName = user.name || user.id;

    const nextIncidentNumber = await incidentRepository.generateNextIncidentNumber(stationCode);

    // Atomic Creation & Alert Linking
    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          stationId: station.id,
          incidentNumber: nextIncidentNumber,
          title: input.title,
          description: input.description,
          severity: input.severity,
          status: IncidentStatus.OPEN,
          category: input.category,
          impact: input.impact || IncidentImpact.MEDIUM,
          assignedTo: input.assignedTo || null,
          createdById: user.id,
          source: "OPERATOR_LOGGED"
        },
        include: {
          station: { select: { id: true, code: true, name: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      // Link any selected alerts
      if (input.alertIds && input.alertIds.length > 0) {
        for (const alertId of input.alertIds) {
          await tx.incidentAlert.create({
            data: {
              incidentId: created.id,
              alertId
            }
          });

          await tx.alert.update({
            where: { id: alertId },
            data: { status: "ESCALATED" }
          });
        }
      }

      // Audit Log
      await tx.operationalEvent.create({
        data: {
          stationId: station.id,
          type: "INCIDENT",
          title: `INCIDENT_CREATED: ${created.title}`,
          description: `Logged by ${operatorName}: ${created.incidentNumber}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            incidentId: created.id,
            incidentNumber: created.incidentNumber,
            severity: created.severity,
            category: created.category,
            createdBy: operatorName
          })
        }
      });

      return created;
    });

    // Realtime broadcast
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

    return incident;
  }

  /**
   * Updates Incident Metadata
   */
  async updateIncident(
    id: string,
    input: UpdateIncidentInput,
    user: { id: string; name?: string; role?: string }
  ): Promise<Incident> {
    const existing = await this.getIncidentDetails(id);
    const operatorName = user.name || user.id;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.incident.update({
        where: { id },
        data: {
          title: input.title ?? existing.title,
          description: input.description ?? existing.description,
          severity: input.severity ?? existing.severity,
          category: input.category ?? existing.category,
          impact: input.impact ?? existing.impact,
          rootCause: input.rootCause ?? existing.rootCause,
          resolutionSummary: input.resolutionSummary ?? existing.resolutionSummary
        },
        include: {
          station: { select: { id: true, code: true, name: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: existing.stationId,
          type: "INCIDENT",
          title: `INCIDENT_UPDATED: ${res.incidentNumber}`,
          description: `Updated by ${operatorName}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            incidentId: id,
            updatedBy: operatorName
          })
        }
      });

      return res;
    });

    const stationCode = (updated.station as { code: string }).code as StationCode;
    realtimeService.publishIncidentEvent(REALTIME_EVENT_TYPES.INCIDENT_UPDATED, {
      id: updated.id,
      stationId: updated.stationId,
      stationCode,
      incidentNumber: updated.incidentNumber,
      title: updated.title,
      severity: updated.severity,
      status: updated.status,
      category: updated.category,
      impact: updated.impact,
      assignedTo: updated.assignedTo || undefined,
      startedAt: updated.startedAt.toISOString(),
      timestamp: updated.updatedAt.toISOString()
    });

    return updated;
  }

  /**
   * Advances Incident Lifecycle Status with validation and audit logging
   */
  async updateIncidentStatus(
    id: string,
    newStatus: IncidentStatus,
    user: { id: string; name?: string; role?: string },
    note?: string,
    resolutionSummary?: string
  ): Promise<Incident> {
    const incident = await this.getIncidentDetails(id);

    if (incident.status === newStatus) {
      return incident;
    }

    if (!isValidIncidentTransition(incident.status, newStatus)) {
      throw ApiError.badRequest(
        `Cannot transition incident from '${incident.status}' to '${newStatus}'`,
        "INVALID_INCIDENT_TRANSITION"
      );
    }

    const operatorName = user.name || user.id;
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        status: newStatus
      };

      if (incident.status === IncidentStatus.OPEN && newStatus === IncidentStatus.INVESTIGATING) {
        updateData.acknowledgedAt = now;
      }
      if (newStatus === IncidentStatus.RESOLVED) {
        updateData.resolvedAt = now;
        updateData.resolvedBy = operatorName;
        if (resolutionSummary) {
          updateData.resolutionSummary = resolutionSummary;
        }
      }
      if (newStatus === IncidentStatus.CLOSED) {
        updateData.closedAt = now;
        updateData.closedBy = operatorName;
      }

      const res = await tx.incident.update({
        where: { id },
        data: updateData,
        include: {
          station: { select: { id: true, code: true, name: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      // Optional note logging
      if (note) {
        await tx.incidentNote.create({
          data: {
            incidentId: id,
            authorId: user.id,
            authorName: operatorName,
            content: `Status changed to ${newStatus}: ${note}`
          }
        });
      }

      // Operational Event
      await tx.operationalEvent.create({
        data: {
          stationId: incident.stationId,
          type: "INCIDENT",
          title: `INCIDENT_STATUS_CHANGED: ${incident.incidentNumber} -> ${newStatus}`,
          description: `Status changed by ${operatorName}${note ? `: ${note}` : ""}`,
          occurredAt: now,
          metadata: JSON.stringify({
            incidentId: id,
            previousStatus: incident.status,
            newStatus,
            changedBy: operatorName,
            note
          })
        }
      });

      return res;
    });

    const stationCode = (updated.station as { code: string }).code as StationCode;
    realtimeService.publishIncidentEvent(REALTIME_EVENT_TYPES.INCIDENT_STATUS_CHANGED, {
      id: updated.id,
      stationId: updated.stationId,
      stationCode,
      incidentNumber: updated.incidentNumber,
      title: updated.title,
      severity: updated.severity,
      status: updated.status,
      category: updated.category,
      impact: updated.impact,
      assignedTo: updated.assignedTo || undefined,
      startedAt: updated.startedAt.toISOString(),
      resolvedAt: updated.resolvedAt?.toISOString(),
      closedAt: updated.closedAt?.toISOString(),
      timestamp: now.toISOString()
    });

    return updated;
  }

  /**
   * Assigns an incident to an operator
   */
  async assignIncident(
    id: string,
    assignedToUserId: string,
    user: { id: string; name?: string; role?: string }
  ): Promise<Incident> {
    const incident = await this.getIncidentDetails(id);

    // Verify assigned user exists
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToUserId }
    });
    if (!assignee) {
      throw ApiError.notFound(`Assignee user '${assignedToUserId}' does not exist`, "USER_NOT_FOUND");
    }

    const operatorName = user.name || user.id;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.incident.update({
        where: { id },
        data: { assignedTo: assignedToUserId },
        include: {
          station: { select: { id: true, code: true, name: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.incidentNote.create({
        data: {
          incidentId: id,
          authorId: user.id,
          authorName: operatorName,
          content: `Incident assigned to ${assignee.name} (${assignee.role})`
        }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: incident.stationId,
          type: "INCIDENT",
          title: `INCIDENT_ASSIGNED: ${incident.incidentNumber}`,
          description: `Assigned to ${assignee.name} by ${operatorName}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            incidentId: id,
            assignedTo: assignee.id,
            assigneeName: assignee.name,
            assignedBy: operatorName
          })
        }
      });

      return res;
    });

    const stationCode = (updated.station as { code: string }).code as StationCode;
    realtimeService.publishIncidentEvent(REALTIME_EVENT_TYPES.INCIDENT_ASSIGNED, {
      id: updated.id,
      stationId: updated.stationId,
      stationCode,
      incidentNumber: updated.incidentNumber,
      title: updated.title,
      severity: updated.severity,
      status: updated.status,
      category: updated.category,
      impact: updated.impact,
      assignedTo: assignee.id,
      assignedUserName: assignee.name,
      startedAt: updated.startedAt.toISOString(),
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Adds an operational note to an incident
   */
  async addIncidentNote(
    id: string,
    content: string,
    user: { id: string; name?: string; role?: string }
  ): Promise<IncidentNote> {
    const incident = await this.getIncidentDetails(id);
    const operatorName = user.name || user.id;

    const note = await incidentRepository.addNote(id, user.id, operatorName, content);

    await prisma.operationalEvent.create({
      data: {
        stationId: incident.stationId,
        type: "INCIDENT",
        title: `INCIDENT_NOTE_ADDED: ${incident.incidentNumber}`,
        description: `Note added by ${operatorName}: ${content.slice(0, 100)}...`,
        occurredAt: new Date(),
        metadata: JSON.stringify({
          incidentId: id,
          noteId: note.id,
          author: operatorName
        })
      }
    });

    return note;
  }

  /**
   * Links an alert to an incident
   */
  async linkAlert(
    incidentId: string,
    alertId: string,
    user: { id: string; name?: string; role?: string }
  ) {
    const incident = await this.getIncidentDetails(incidentId);
    const alert = await alertRepository.findById(alertId);
    if (!alert) {
      throw ApiError.notFound(`Alert '${alertId}' not found`, "ALERT_NOT_FOUND");
    }

    if (alert.stationId !== incident.stationId) {
      throw ApiError.badRequest(
        "Cannot link alert from a different research station",
        "STATION_MISMATCH"
      );
    }

    const operatorName = user.name || user.id;

    await prisma.$transaction(async (tx) => {
      await tx.incidentAlert.upsert({
        where: {
          incidentId_alertId: { incidentId, alertId }
        },
        create: { incidentId, alertId },
        update: {}
      });

      await tx.alert.update({
        where: { id: alertId },
        data: { status: "ESCALATED" }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: incident.stationId,
          type: "INCIDENT",
          title: `INCIDENT_ALERT_LINKED: Alert ${alert.title} -> ${incident.incidentNumber}`,
          description: `Linked by ${operatorName}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            incidentId,
            alertId,
            linkedBy: operatorName
          })
        }
      });
    });

    return { success: true };
  }

  /**
   * Unlinks an alert from an incident
   */
  async unlinkAlert(
    incidentId: string,
    alertId: string,
    user: { id: string; name?: string; role?: string }
  ) {
    const incident = await this.getIncidentDetails(incidentId);
    const operatorName = user.name || user.id;

    await prisma.$transaction(async (tx) => {
      await tx.incidentAlert.deleteMany({
        where: { incidentId, alertId }
      });

      await tx.operationalEvent.create({
        data: {
          stationId: incident.stationId,
          type: "INCIDENT",
          title: `INCIDENT_ALERT_UNLINKED: Alert ${alertId} from ${incident.incidentNumber}`,
          description: `Unlinked by ${operatorName}`,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            incidentId,
            alertId,
            unlinkedBy: operatorName
          })
        }
      });
    });

    return { success: true };
  }

  /**
   * Retrieves operational timeline for this incident
   */
  async getIncidentTimeline(id: string) {
    await this.getIncidentDetails(id);
    return await incidentRepository.getTimeline(id);
  }
}

export const incidentService = new IncidentService();
