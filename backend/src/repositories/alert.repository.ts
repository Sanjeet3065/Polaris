import { Alert, AlertSeverity, AlertStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface AlertFilterOptions {
  severity?: AlertSeverity;
  status?: AlertStatus;
}

export class AlertRepository {
  /**
   * Retrieves paginated alerts for a station
   */
  async findByStationId(
    stationId: string,
    options: PaginationParams & AlertFilterOptions
  ): Promise<Alert[]> {
    try {
      const where: Prisma.AlertWhereInput = {
        stationId,
        ...(options.severity && { severity: options.severity }),
        ...(options.status && { status: options.status })
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.alert.findMany({
        where,
        include: {
          equipment: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true
            }
          }
        },
        orderBy: [{ occurredAt: "desc" }],
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "Alerts");
    }
  }

  /**
   * Counts alerts matching filter criteria
   */
  async countByStationId(stationId: string, filter?: AlertFilterOptions): Promise<number> {
    try {
      const where: Prisma.AlertWhereInput = {
        stationId,
        ...(filter?.severity && { severity: filter.severity }),
        ...(filter?.status && { status: filter.status })
      };

      return await prisma.alert.count({ where });
    } catch (error) {
      handleDbError(error, "AlertsCount");
    }
  }

  /**
   * Finds a specific alert by UUID
   */
  async findById(id: string): Promise<Alert | null> {
    try {
      return await prisma.alert.findUnique({
        where: { id },
        include: {
          equipment: true,
          station: {
            select: { id: true, code: true, name: true }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "Alert");
    }
  }
}

export const alertRepository = new AlertRepository();
