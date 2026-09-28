import { MaintenanceRecord, MaintenanceStatus } from "@prisma/client";
import { maintenanceRepository } from "../repositories/maintenance.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";

export interface MaintenanceQuery {
  page: number;
  limit: number;
  status?: MaintenanceStatus;
}

export class MaintenanceService {
  /**
   * Retrieves paginated maintenance work orders for equipment at a station
   */
  async getMaintenanceByStation(
    stationIdentifier: string,
    query: MaintenanceQuery
  ): Promise<PaginatedResult<MaintenanceRecord>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const [items, total] = await Promise.all([
      maintenanceRepository.findByStationId(station.id, {
        page: query.page,
        limit: query.limit,
        status: query.status
      }),
      maintenanceRepository.countByStationId(station.id, {
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
   * Retrieves single maintenance record
   */
  async getMaintenanceRecord(id: string): Promise<MaintenanceRecord> {
    const record = await maintenanceRepository.findById(id);
    if (!record) {
      throw ApiError.notFound(
        `Maintenance record with ID '${id}' was not found`,
        "RECORD_NOT_FOUND"
      );
    }
    return record;
  }
}

export const maintenanceService = new MaintenanceService();
