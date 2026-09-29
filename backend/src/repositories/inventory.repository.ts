import { InventoryItem, InventoryStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams } from "../types/pagination.types";

export interface InventoryFilterOptions {
  stationId?: string;
  category?: string;
  status?: InventoryStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface InventoryOverview {
  totalItems: number;
  inStock: number;
  lowStock: number;
  criticalStock: number;
  outOfStock: number;
  totalCategories: number;
  categories: { category: string; count: number }[];
}

export class InventoryRepository {
  /**
   * Retrieves paginated logistics inventory items with flexible station, category, status, and search filters
   */
  async findAll(
    options: PaginationParams & InventoryFilterOptions
  ): Promise<any[]> {
    try {
      const stationCondition = options.stationId
        ? {
            OR: [
              { stationId: options.stationId },
              { station: { code: options.stationId.toUpperCase() } }
            ]
          }
        : {};

      const where: Prisma.InventoryItemWhereInput = {
        ...stationCondition,
        ...(options.status && { status: options.status }),
        ...(options.category && {
          category: { contains: options.category, mode: "insensitive" }
        }),
        ...(options.search && {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { sku: { contains: options.search, mode: "insensitive" } },
            { storageLocation: { contains: options.search, mode: "insensitive" } },
            { category: { contains: options.search, mode: "insensitive" } }
          ]
        })
      };

      const skip = (options.page - 1) * options.limit;
      const orderBy: Prisma.InventoryItemOrderByWithRelationInput = options.sortBy
        ? { [options.sortBy]: options.sortOrder || "asc" }
        : { name: "asc" };

      return await prisma.inventoryItem.findMany({
        where,
        include: {
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        },
        orderBy,
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
  async count(filter?: InventoryFilterOptions): Promise<number> {
    try {
      const stationCondition = filter?.stationId
        ? {
            OR: [
              { stationId: filter.stationId },
              { station: { code: filter.stationId.toUpperCase() } }
            ]
          }
        : {};

      const where: Prisma.InventoryItemWhereInput = {
        ...stationCondition,
        ...(filter?.status && { status: filter.status }),
        ...(filter?.category && {
          category: { contains: filter.category, mode: "insensitive" }
        }),
        ...(filter?.search && {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { sku: { contains: filter.search, mode: "insensitive" } },
            { storageLocation: { contains: filter.search, mode: "insensitive" } },
            { category: { contains: filter.search, mode: "insensitive" } }
          ]
        })
      };

      return await prisma.inventoryItem.count({ where });
    } catch (error) {
      handleDbError(error, "InventoryCount");
    }
  }

  /**
   * Retrieves paginated logistics inventory items for a station (Phase 2 backward compatibility)
   */
  async findByStationId(
    stationId: string,
    options: PaginationParams & { category?: string; status?: InventoryStatus; search?: string }
  ): Promise<InventoryItem[]> {
    return this.findAll({
      ...options,
      stationId
    });
  }

  /**
   * Counts inventory items matching filter for a station (Phase 2 backward compatibility)
   */
  async countByStationId(
    stationId: string,
    filter?: { category?: string; status?: InventoryStatus; search?: string }
  ): Promise<number> {
    return this.count({
      ...filter,
      stationId
    });
  }

  /**
   * Finds a specific inventory item by UUID including station and latest movements
   */
  async findById(id: string): Promise<any | null> {
    try {
      return await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          movements: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "InventoryItem");
    }
  }

  /**
   * Finds an item by station and SKU
   */
  async findBySku(stationId: string, sku: string): Promise<InventoryItem | null> {
    try {
      return await prisma.inventoryItem.findUnique({
        where: {
          stationId_sku: {
            stationId,
            sku
          }
        }
      });
    } catch (error) {
      handleDbError(error, "InventoryItemBySku");
    }
  }

  /**
   * Creates a new inventory item
   */
  async create(data: Prisma.InventoryItemCreateInput): Promise<InventoryItem> {
    try {
      return await prisma.inventoryItem.create({
        data,
        include: {
          station: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      handleDbError(error, "InventoryItemCreate");
    }
  }

  /**
   * Updates an existing inventory item
   */
  async update(id: string, data: Prisma.InventoryItemUpdateInput): Promise<InventoryItem> {
    try {
      return await prisma.inventoryItem.update({
        where: { id },
        data
      });
    } catch (error) {
      handleDbError(error, "InventoryItemUpdate");
    }
  }

  /**
   * Retrieves operational inventory overview KPI statistics
   */
  async getOverview(stationId?: string): Promise<InventoryOverview> {
    try {
      const stationCondition = stationId
        ? {
            OR: [
              { stationId },
              { station: { code: stationId.toUpperCase() } }
            ]
          }
        : {};

      const where: Prisma.InventoryItemWhereInput = {
        ...stationCondition
      };

      const [totalItems, inStock, lowStock, criticalStock, outOfStock, rawCategories] = await Promise.all([
        prisma.inventoryItem.count({ where }),
        prisma.inventoryItem.count({ where: { ...where, status: InventoryStatus.IN_STOCK } }),
        prisma.inventoryItem.count({ where: { ...where, status: InventoryStatus.LOW_STOCK } }),
        prisma.inventoryItem.count({ where: { ...where, status: InventoryStatus.CRITICAL } }),
        prisma.inventoryItem.count({ where: { ...where, status: InventoryStatus.OUT_OF_STOCK } }),
        prisma.inventoryItem.groupBy({
          by: ["category"],
          where,
          _count: { _all: true }
        })
      ]);

      const categories = rawCategories.map((c) => ({
        category: c.category,
        count: c._count._all
      }));

      return {
        totalItems,
        inStock,
        lowStock,
        criticalStock,
        outOfStock,
        totalCategories: categories.length,
        categories
      };
    } catch (error) {
      handleDbError(error, "InventoryOverview");
    }
  }
}

export const inventoryRepository = new InventoryRepository();
