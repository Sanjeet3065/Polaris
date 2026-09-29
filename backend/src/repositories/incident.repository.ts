import { Incident, IncidentStatus, IncidentSeverity, IncidentCategory, IncidentImpact, IncidentNote, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface IncidentFilterOptions {
  stationId?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  assignedTo?: string;
  search?: string;
}

export interface IncidentOverviewKpi {
  totalIncidents: number;
  openIncidents: number;
  investigatingIncidents: number;
  mitigatingIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;
  criticalSeverity: number;
  highSeverity: number;
  criticalImpact: number;
}

export class IncidentRepository {
  /**
   * Builds Prisma WhereInput supporting station UUID or station code ("MAITRI", "BHARATI", "ALL")
   */
  private buildWhereClause(filter?: IncidentFilterOptions): Prisma.IncidentWhereInput {
    const where: Prisma.IncidentWhereInput = {};

    if (filter?.stationId && filter.stationId !== "ALL") {
      const isCode = ["MAITRI", "BHARATI"].includes(filter.stationId.toUpperCase());
      if (isCode) {
        where.station = { code: filter.stationId.toUpperCase() };
      } else {
        where.OR = [
          { stationId: filter.stationId },
          { station: { code: filter.stationId.toUpperCase() } }
        ];
      }
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.severity) {
      where.severity = filter.severity;
    }

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.assignedTo) {
      where.assignedTo = filter.assignedTo;
    }

    if (filter?.search && filter.search.trim() !== "") {
      const q = filter.search.trim();
      where.AND = [
        {
          OR: [
            { incidentNumber: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { rootCause: { contains: q, mode: "insensitive" } },
            { resolutionSummary: { contains: q, mode: "insensitive" } }
          ]
        }
      ];
    }

    return where;
  }

  /**
   * Retrieves paginated incidents matching criteria
   */
  async findMany(options: PaginationParams & IncidentFilterOptions): Promise<Incident[]> {
    try {
      const where = this.buildWhereClause(options);
      const skip = (options.page - 1) * options.limit;

      return await prisma.incident.findMany({
        where,
        include: {
          station: {
            select: { id: true, code: true, name: true }
          },
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          alerts: {
            include: {
              alert: {
                select: {
                  id: true,
                  title: true,
                  severity: true,
                  status: true,
                  source: true,
                  occurredAt: true
                }
              }
            }
          },
          _count: {
            select: {
              alerts: true,
              notes: true
            }
          }
        },
        orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "IncidentsFindMany");
    }
  }

  /**
   * Counts total incidents matching filter criteria
   */
  async count(filter?: IncidentFilterOptions): Promise<number> {
    try {
      const where = this.buildWhereClause(filter);
      return await prisma.incident.count({ where });
    } catch (error) {
      handleDbError(error, "IncidentsCount");
    }
  }

  /**
   * Finds incident by ID with all relations, linked alerts, notes, and audit log entries
   */
  async findById(id: string): Promise<Incident | null> {
    try {
      return await prisma.incident.findUnique({
        where: { id },
        include: {
          station: {
            select: { id: true, code: true, name: true }
          },
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          alerts: {
            include: {
              alert: {
                include: {
                  equipment: {
                    select: { id: true, code: true, name: true, category: true }
                  }
                }
              }
            }
          },
          notes: {
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: { id: true, name: true, role: true }
              }
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "IncidentFindById");
    }
  }

  /**
   * Finds incident by incidentNumber (e.g. INC-MAI-2026-001)
   */
  async findByIncidentNumber(incidentNumber: string): Promise<Incident | null> {
    try {
      return await prisma.incident.findUnique({
        where: { incidentNumber },
        include: {
          station: {
            select: { id: true, code: true, name: true }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "IncidentFindByNumber");
    }
  }

  /**
   * Generates next sequential incident number for station
   */
  async generateNextIncidentNumber(stationCode: string): Promise<string> {
    try {
      const prefix = `INC-${stationCode.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}`;
      const count = await prisma.incident.count({
        where: {
          incidentNumber: { startsWith: prefix }
        }
      });
      const seq = String(count + 1).padStart(3, "0");
      return `${prefix}-${seq}`;
    } catch (error) {
      handleDbError(error, "GenerateIncidentNumber");
    }
  }

  /**
   * Aggregates Incident KPIs for Station or Global Fleet
   */
  async getOverview(stationId?: string): Promise<IncidentOverviewKpi> {
    try {
      const whereBase: Prisma.IncidentWhereInput = {};
      if (stationId && stationId !== "ALL") {
        const isCode = ["MAITRI", "BHARATI"].includes(stationId.toUpperCase());
        if (isCode) {
          whereBase.station = { code: stationId.toUpperCase() };
        } else {
          whereBase.OR = [
            { stationId },
            { station: { code: stationId.toUpperCase() } }
          ];
        }
      }

      const [
        totalIncidents,
        openIncidents,
        investigatingIncidents,
        mitigatingIncidents,
        resolvedIncidents,
        closedIncidents,
        criticalSeverity,
        highSeverity,
        criticalImpact
      ] = await Promise.all([
        prisma.incident.count({ where: whereBase }),
        prisma.incident.count({ where: { ...whereBase, status: IncidentStatus.OPEN } }),
        prisma.incident.count({ where: { ...whereBase, status: IncidentStatus.INVESTIGATING } }),
        prisma.incident.count({ where: { ...whereBase, status: IncidentStatus.MITIGATING } }),
        prisma.incident.count({ where: { ...whereBase, status: IncidentStatus.RESOLVED } }),
        prisma.incident.count({ where: { ...whereBase, status: IncidentStatus.CLOSED } }),
        prisma.incident.count({ where: { ...whereBase, severity: IncidentSeverity.CRITICAL } }),
        prisma.incident.count({ where: { ...whereBase, severity: IncidentSeverity.HIGH } }),
        prisma.incident.count({ where: { ...whereBase, impact: IncidentImpact.CRITICAL } })
      ]);

      return {
        totalIncidents,
        openIncidents,
        investigatingIncidents,
        mitigatingIncidents,
        resolvedIncidents,
        closedIncidents,
        criticalSeverity,
        highSeverity,
        criticalImpact
      };
    } catch (error) {
      handleDbError(error, "IncidentOverviewKPI");
    }
  }

  /**
   * Creates an incident
   */
  async create(data: Prisma.IncidentCreateInput): Promise<Incident> {
    try {
      return await prisma.incident.create({
        data,
        include: {
          station: { select: { id: true, code: true, name: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });
    } catch (error) {
      handleDbError(error, "IncidentCreate");
    }
  }

  /**
   * Updates an incident
   */
  async update(id: string, data: Prisma.IncidentUpdateInput): Promise<Incident> {
    try {
      return await prisma.incident.update({
        where: { id },
        data,
        include: {
          station: { select: { id: true, code: true, name: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });
    } catch (error) {
      handleDbError(error, "IncidentUpdate");
    }
  }

  /**
   * Adds an operational note to an incident
   */
  async addNote(incidentId: string, authorId: string | null, authorName: string | null, content: string): Promise<IncidentNote> {
    try {
      return await prisma.incidentNote.create({
        data: {
          incidentId,
          authorId,
          authorName,
          content
        },
        include: {
          author: { select: { id: true, name: true, role: true } }
        }
      });
    } catch (error) {
      handleDbError(error, "IncidentAddNote");
    }
  }

  /**
   * Links an alert to an incident
   */
  async linkAlert(incidentId: string, alertId: string) {
    try {
      return await prisma.incidentAlert.create({
        data: {
          incidentId,
          alertId
        }
      });
    } catch (error) {
      handleDbError(error, "IncidentLinkAlert");
    }
  }

  /**
   * Unlinks an alert from an incident
   */
  async unlinkAlert(incidentId: string, alertId: string) {
    try {
      return await prisma.incidentAlert.deleteMany({
        where: {
          incidentId,
          alertId
        }
      });
    } catch (error) {
      handleDbError(error, "IncidentUnlinkAlert");
    }
  }

  /**
   * Retrieves operational timeline events for an incident
   */
  async getTimeline(incidentId: string) {
    try {
      const incident = await this.findById(incidentId);
      if (!incident) return [];

      return await prisma.operationalEvent.findMany({
        where: {
          stationId: incident.stationId,
          metadata: { contains: incidentId }
        },
        orderBy: { occurredAt: "desc" },
        take: 50
      });
    } catch (error) {
      handleDbError(error, "IncidentTimeline");
    }
  }
}

export const incidentRepository = new IncidentRepository();
