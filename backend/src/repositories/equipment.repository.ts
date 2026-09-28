import {
  Equipment,
  EquipmentHealth,
  EquipmentCategory,
  EquipmentStatus,
  Prisma
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface EquipmentFilterOptions {
  category?: EquipmentCategory;
  status?: EquipmentStatus;
}

export type EquipmentWithDetails = Prisma.EquipmentGetPayload<{
  include: {
    healthRecords: true;
    maintenanceRecords: true;
  };
}>;

export class EquipmentRepository {
  /**
   * Retrieves equipment belonging to a station with optional category & status filtering
   */
  async findByStationId(
    stationId: string,
    options: PaginationParams & EquipmentFilterOptions
  ): Promise<Equipment[]> {
    try {
      const where: Prisma.EquipmentWhereInput = {
        stationId,
        ...(options.category && { category: options.category }),
        ...(options.status && { status: options.status })
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.equipment.findMany({
        where,
        orderBy: [{ status: "asc" }, { code: "asc" }],
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "Equipment");
    }
  }

  /**
   * Counts equipment matching criteria
   */
  async countByStationId(
    stationId: string,
    filter?: EquipmentFilterOptions
  ): Promise<number> {
    try {
      const where: Prisma.EquipmentWhereInput = {
        stationId,
        ...(filter?.category && { category: filter.category }),
        ...(filter?.status && { status: filter.status })
      };

      return await prisma.equipment.count({ where });
    } catch (error) {
      handleDbError(error, "EquipmentCount");
    }
  }

  /**
   * Finds a specific piece of equipment with recent health and maintenance
   */
  async findById(id: string): Promise<EquipmentWithDetails | null> {
    try {
      return await prisma.equipment.findUnique({
        where: { id },
        include: {
          healthRecords: {
            orderBy: { recordedAt: "desc" },
            take: 5
          },
          maintenanceRecords: {
            orderBy: { scheduledAt: "desc" },
            take: 5
          }
        }
      });
    } catch (error) {
      handleDbError(error, "Equipment");
    }
  }

  /**
   * Retrieves paginated health and vibration telemetry history for equipment
   */
  async findHealthHistory(
    equipmentId: string,
    options: PaginationParams
  ): Promise<EquipmentHealth[]> {
    try {
      const skip = (options.page - 1) * options.limit;

      return await prisma.equipmentHealth.findMany({
        where: { equipmentId },
        orderBy: { recordedAt: "desc" },
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "EquipmentHealth");
    }
  }

  /**
   * Counts health history rows for an equipment
   */
  async countHealthHistory(equipmentId: string): Promise<number> {
    try {
      return await prisma.equipmentHealth.count({
        where: { equipmentId }
      });
    } catch (error) {
      handleDbError(error, "EquipmentHealthCount");
    }
  }
}

export const equipmentRepository = new EquipmentRepository();
