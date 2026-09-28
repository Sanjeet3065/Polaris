import { InventoryItem, InventoryStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface InventoryFilterOptions {
  category?: string;
  status?: InventoryStatus;
}

export class InventoryRepository {
  /**
   * Retrieves paginated logistics inventory items for a station
   */
  async findByStationId(
    stationId: string,
    options: PaginationParams & InventoryFilterOptions
  ): Promise<InventoryItem[]> {
    try {
      const where: Prisma.InventoryItemWhereInput = {
        stationId,
        ...(options.status && { status: options.status }),
        ...(options.category && {
          category: { contains: options.category, mode: "insensitive" }
        })
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.inventoryItem.findMany({
        where,
        orderBy: [{ status: "asc" }, { name: "asc" }],
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "Inventory");
    }
  }

  /**
   * Counts inventory items matching filter
   */
  async countByStationId(
    stationId: string,
    filter?: InventoryFilterOptions
  ): Promise<number> {
    try {
      const where: Prisma.InventoryItemWhereInput = {
        stationId,
        ...(filter?.status && { status: filter.status }),
        ...(filter?.category && {
          category: { contains: filter.category, mode: "insensitive" }
        })
      };

      return await prisma.inventoryItem.count({ where });
    } catch (error) {
      handleDbError(error, "InventoryCount");
    }
  }

  /**
   * Finds a specific inventory item by UUID
   */
  async findById(id: string): Promise<InventoryItem | null> {
    try {
      return await prisma.inventoryItem.findUnique({
        where: { id }
      });
    } catch (error) {
      handleDbError(error, "InventoryItem");
    }
  }
}

export const inventoryRepository = new InventoryRepository();
