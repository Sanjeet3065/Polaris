import { InventoryItem, InventoryStatus } from "@prisma/client";
import { inventoryRepository } from "../repositories/inventory.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";

export interface InventoryQuery {
  page: number;
  limit: number;
  category?: string;
  status?: InventoryStatus;
}

export class InventoryService {
  /**
   * Retrieves paginated logistics supplies and equipment inventory
   */
  async getInventoryByStation(
    stationIdentifier: string,
    query: InventoryQuery
  ): Promise<PaginatedResult<InventoryItem>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const [items, total] = await Promise.all([
      inventoryRepository.findByStationId(station.id, {
        page: query.page,
        limit: query.limit,
        category: query.category,
        status: query.status
      }),
      inventoryRepository.countByStationId(station.id, {
        category: query.category,
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
   * Retrieves single inventory item
   */
  async getInventoryItem(id: string): Promise<InventoryItem> {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Inventory item with ID '${id}' was not found`, "ITEM_NOT_FOUND");
    }
    return item;
  }
}

export const inventoryService = new InventoryService();
