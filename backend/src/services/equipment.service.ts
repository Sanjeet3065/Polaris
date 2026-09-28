import { Equipment, EquipmentHealth, EquipmentCategory, EquipmentStatus } from "@prisma/client";
import { equipmentRepository } from "../repositories/equipment.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";

export interface EquipmentQuery {
  page: number;
  limit: number;
  category?: EquipmentCategory;
  status?: EquipmentStatus;
}

export class EquipmentService {
  /**
   * Retrieves paginated equipment catalog for a station
   */
  async getEquipmentByStation(
    stationIdentifier: string,
    query: EquipmentQuery
  ): Promise<PaginatedResult<Equipment>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const [items, total] = await Promise.all([
      equipmentRepository.findByStationId(station.id, {
        page: query.page,
        limit: query.limit,
        category: query.category,
        status: query.status
      }),
      equipmentRepository.countByStationId(station.id, {
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
   * Retrieves single equipment details with recent telemetry
   */
  async getEquipmentDetails(id: string): Promise<Equipment> {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw ApiError.notFound(`Equipment with ID '${id}' was not found`, "EQUIPMENT_NOT_FOUND");
    }
    return equipment;
  }

  /**
   * Retrieves diagnostic health observation history for a specific machine
   */
  async getEquipmentHealthHistory(
    equipmentId: string,
    query: { page: number; limit: number }
  ): Promise<PaginatedResult<EquipmentHealth>> {
    // Verify equipment exists
    await this.getEquipmentDetails(equipmentId);

    const [items, total] = await Promise.all([
      equipmentRepository.findHealthHistory(equipmentId, query),
      equipmentRepository.countHealthHistory(equipmentId)
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
}

export const equipmentService = new EquipmentService();
