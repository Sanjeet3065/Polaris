import { EnvironmentalReading } from "@prisma/client";
import { environmentRepository } from "../repositories/environment.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";

export interface EnvironmentalHistoryQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
}

export class EnvironmentService {
  /**
   * Retrieves the latest atmospheric measurement for a station
   */
  async getLatestEnvironment(stationIdentifier: string): Promise<EnvironmentalReading> {
    const station = await stationService.resolveStation(stationIdentifier);
    const latest = await environmentRepository.findLatestByStationId(station.id);

    if (!latest) {
      throw ApiError.notFound(
        `No environmental readings available for station '${station.code}'`,
        "NO_ENVIRONMENTAL_DATA"
      );
    }

    return latest;
  }

  /**
   * Retrieves paginated atmospheric & microclimate observation history
   */
  async getEnvironmentalHistory(
    stationIdentifier: string,
    query: EnvironmentalHistoryQuery
  ): Promise<PaginatedResult<EnvironmentalReading>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    const [items, total] = await Promise.all([
      environmentRepository.findHistory(station.id, {
        page: query.page,
        limit: query.limit,
        from: fromDate,
        to: toDate
      }),
      environmentRepository.countHistory(station.id, {
        from: fromDate,
        to: toDate
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
}

export const environmentService = new EnvironmentService();
