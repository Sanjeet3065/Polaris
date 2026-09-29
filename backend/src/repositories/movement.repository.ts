import { InventoryMovement, Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface MovementFilterOptions {
  stationId?: string;
  itemId?: string;
  type?: StockMovementType;
  from?: Date;
  to?: Date;
}

export class MovementRepository {
  /**
   * Records a new stock ledger movement
   */
  async create(data: Prisma.InventoryMovementCreateInput): Promise<InventoryMovement> {
    try {
      return await prisma.inventoryMovement.create({
        data,
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true
            }
          },
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "InventoryMovementCreate");
    }
  }

  /**
   * Finds movements with flexible station, item, type, and date range filters
   */
  async findAll(
    options: PaginationParams & MovementFilterOptions
  ): Promise<any[]> {
    try {
      const where: Prisma.InventoryMovementWhereInput = {
        ...(options.stationId && { stationId: options.stationId }),
        ...(options.itemId && { itemId: options.itemId }),
        ...(options.type && { type: options.type }),
        ...(options.from || options.to ? {
          createdAt: {
            ...(options.from && { gte: options.from }),
            ...(options.to && { lte: options.to })
          }
        } : {})
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.inventoryMovement.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
              category: true
            }
          },
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "InventoryMovementFindAll");
    }
  }

  /**
   * Counts movements matching filter
   */
  async count(filter?: MovementFilterOptions): Promise<number> {
    try {
      const where: Prisma.InventoryMovementWhereInput = {
        ...(filter?.stationId && { stationId: filter.stationId }),
        ...(filter?.itemId && { itemId: filter.itemId }),
        ...(filter?.type && { type: filter.type }),
        ...(filter?.from || filter?.to ? {
          createdAt: {
            ...(filter?.from && { gte: filter.from }),
            ...(filter?.to && { lte: filter.to })
          }
        } : {})
      };

      return await prisma.inventoryMovement.count({ where });
    } catch (error) {
      handleDbError(error, "InventoryMovementCount");
    }
  }
}

export const movementRepository = new MovementRepository();
