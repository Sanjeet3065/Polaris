import { Alert, AlertSeverity, AlertStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface ExtendedAlertFilterOptions {
  stationId?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  sourceType?: string;
  ruleCode?: string;
  search?: string;
}

export interface AlertOverviewKpi {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  infoAlerts: number;
  acknowledgedAlerts: number;
  unacknowledgedAlerts: number;
  resolvedAlerts: number;
  suppressedAlerts: number;
}

export class AlertRepository {
  /**
   * Builds Prisma WhereInput supporting station UUID or station code ("MAITRI", "BHARATI", "ALL")
   */
  private buildWhereClause(filter?: ExtendedAlertFilterOptions): Prisma.AlertWhereInput {
    const where: Prisma.AlertWhereInput = {};

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

    if (filter?.severity) {
      where.severity = filter.severity;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.sourceType) {
      where.sourceType = filter.sourceType;
    }

    if (filter?.ruleCode) {
      where.ruleCode = filter.ruleCode;
    }

    if (filter?.search && filter.search.trim() !== "") {
      const q = filter.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
            { ruleCode: { contains: q, mode: "insensitive" } },
            { sourceId: { contains: q, mode: "insensitive" } }
          ]
        }
      ];
    }

    return where;
  }

  /**
   * Retrieves paginated alerts for a station (Phase 2 backward compatibility)
   */
  async findByStationId(
    stationId: string,
    options: PaginationParams & { severity?: AlertSeverity; status?: AlertStatus }
  ): Promise<Alert[]> {
    return this.findMany({
      ...options,
      stationId
    });
  }

  /**
   * Counts alerts matching filter criteria for station (Phase 2 backward compatibility)
   */
  async countByStationId(
    stationId: string,
    filter?: { severity?: AlertSeverity; status?: AlertStatus }
  ): Promise<number> {
    return this.count({
      ...filter,
      stationId
    });
  }

  /**
   * General multi-filter alert listing
   */
  async findMany(options: PaginationParams & ExtendedAlertFilterOptions): Promise<Alert[]> {
    try {
      const where = this.buildWhereClause(options);
      const skip = (options.page - 1) * options.limit;

      return await prisma.alert.findMany({
        where,
        include: {
          equipment: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              status: true
            }
          },
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          incidentAlerts: {
            include: {
              incident: {
                select: {
                  id: true,
                  incidentNumber: true,
                  title: true,
                  status: true,
                  severity: true
                }
              }
            }
          }
        },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "AlertsFindMany");
    }
  }

  /**
   * Counts total alerts matching filter criteria
   */
  async count(filter?: ExtendedAlertFilterOptions): Promise<number> {
    try {
      const where = this.buildWhereClause(filter);
      return await prisma.alert.count({ where });
    } catch (error) {
      handleDbError(error, "AlertsCount");
    }
  }

  /**
   * Finds a specific alert by ID with equipment, station, and linked incidents
   */
  async findById(id: string): Promise<Alert | null> {
    try {
      return await prisma.alert.findUnique({
        where: { id },
        include: {
          equipment: true,
          station: {
            select: { id: true, code: true, name: true }
          },
          incidentAlerts: {
            include: {
              incident: {
                select: {
                  id: true,
                  incidentNumber: true,
                  title: true,
                  status: true,
                  severity: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "AlertFindById");
    }
  }

  /**
   * Finds active alert for deduplication by station, ruleCode, and optional sourceId
   */
  async findActiveAlert(
    stationId: string,
    ruleCode: string,
    sourceId?: string | null
  ): Promise<Alert | null> {
    try {
      return await prisma.alert.findFirst({
        where: {
          stationId,
          ruleCode,
          sourceId: sourceId ?? null,
          status: {
            in: [AlertStatus.OPEN, AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.ESCALATED]
          }
        },
        orderBy: { occurredAt: "desc" }
      });
    } catch (error) {
      handleDbError(error, "FindActiveAlert");
    }
  }

  /**
   * Aggregated Alert KPIs for Station or Global Fleet
   */
  async getOverview(stationId?: string): Promise<AlertOverviewKpi> {
    try {
      const whereBase: Prisma.AlertWhereInput = {};
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

      const activeStatuses = [AlertStatus.OPEN, AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.ESCALATED];

      const [
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        highAlerts,
        mediumAlerts,
        lowAlerts,
        infoAlerts,
        acknowledgedAlerts,
        unacknowledgedAlerts,
        resolvedAlerts,
        suppressedAlerts
      ] = await Promise.all([
        prisma.alert.count({ where: whereBase }),
        prisma.alert.count({ where: { ...whereBase, status: { in: activeStatuses } } }),
        prisma.alert.count({ where: { ...whereBase, status: { in: activeStatuses }, severity: AlertSeverity.CRITICAL } }),
        prisma.alert.count({ where: { ...whereBase, status: { in: activeStatuses }, severity: AlertSeverity.HIGH } }),
        prisma.alert.count({
          where: {
            ...whereBase,
            status: { in: activeStatuses },
            severity: { in: [AlertSeverity.MEDIUM, AlertSeverity.WARNING] }
          }
        }),
        prisma.alert.count({ where: { ...whereBase, status: { in: activeStatuses }, severity: AlertSeverity.LOW } }),
        prisma.alert.count({ where: { ...whereBase, status: { in: activeStatuses }, severity: AlertSeverity.INFO } }),
        prisma.alert.count({ where: { ...whereBase, status: AlertStatus.ACKNOWLEDGED } }),
        prisma.alert.count({ where: { ...whereBase, status: { in: [AlertStatus.OPEN, AlertStatus.ACTIVE] } } }),
        prisma.alert.count({ where: { ...whereBase, status: AlertStatus.RESOLVED } }),
        prisma.alert.count({ where: { ...whereBase, status: AlertStatus.SUPPRESSED } })
      ]);

      return {
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        highAlerts,
        mediumAlerts,
        lowAlerts,
        infoAlerts,
        acknowledgedAlerts,
        unacknowledgedAlerts,
        resolvedAlerts,
        suppressedAlerts
      };
    } catch (error) {
      handleDbError(error, "AlertOverviewKPI");
    }
  }

  /**
   * Creates an alert record
   */
  async create(data: Prisma.AlertCreateInput): Promise<Alert> {
    try {
      return await prisma.alert.create({
        data,
        include: {
          station: { select: { id: true, code: true, name: true } },
          equipment: { select: { id: true, code: true, name: true } }
        }
      });
    } catch (error) {
      handleDbError(error, "AlertCreate");
    }
  }

  /**
   * Updates an alert record
   */
  async update(id: string, data: Prisma.AlertUpdateInput): Promise<Alert> {
    try {
      return await prisma.alert.update({
        where: { id },
        data,
        include: {
          station: { select: { id: true, code: true, name: true } },
          equipment: { select: { id: true, code: true, name: true } }
        }
      });
    } catch (error) {
      handleDbError(error, "AlertUpdate");
    }
  }

  /**
   * Fetches timeline events related to this alert
   */
  async getTimeline(alertId: string) {
    try {
      const alert = await this.findById(alertId);
      if (!alert) return [];

      return await prisma.operationalEvent.findMany({
        where: {
          stationId: alert.stationId,
          metadata: { contains: alertId }
        },
        orderBy: { occurredAt: "desc" },
        take: 50
      });
    } catch (error) {
      handleDbError(error, "AlertTimeline");
    }
  }
}

export const alertRepository = new AlertRepository();
