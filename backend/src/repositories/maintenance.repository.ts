import { MaintenanceRecord, MaintenanceStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface MaintenanceFilterOptions {
  status?: MaintenanceStatus;
}

export class MaintenanceRepository {
  /**
   * Retrieves paginated maintenance work orders for equipment at a station
   */
  async findByStationId(
    stationId: string,
    options: PaginationParams & MaintenanceFilterOptions
  ): Promise<MaintenanceRecord[]> {
    try {
      const where: Prisma.MaintenanceRecordWhereInput = {
        equipment: {
          stationId
        },
        ...(options.status && { status: options.status })
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.maintenanceRecord.findMany({
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
        orderBy: [{ scheduledAt: "desc" }],
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "MaintenanceRecords");
    }
  }

  /**
   * Counts maintenance records for equipment at a station
   */
  async countByStationId(
    stationId: string,
    filter?: MaintenanceFilterOptions
  ): Promise<number> {
    try {
      const where: Prisma.MaintenanceRecordWhereInput = {
        equipment: {
          stationId
        },
        ...(filter?.status && { status: filter.status })
      };

      return await prisma.maintenanceRecord.count({ where });
    } catch (error) {
      handleDbError(error, "MaintenanceRecordsCount");
    }
  }

  /**
   * Finds a specific maintenance record by UUID
   */
  async findById(id: string): Promise<MaintenanceRecord | null> {
    try {
      return await prisma.maintenanceRecord.findUnique({
        where: { id },
        include: {
          equipment: true
        }
      });
    } catch (error) {
      handleDbError(error, "MaintenanceRecord");
    }
  }
}

export const maintenanceRepository = new MaintenanceRepository();
