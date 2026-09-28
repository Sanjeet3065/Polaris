import { EnergyReading } from "@prisma/client";
import { energyRepository } from "../repositories/energy.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";

export interface EnergyHistoryQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
}

export class EnergyService {
  /**
   * Retrieves the latest power and fuel telemetry for a station
   */
  async getLatestEnergy(stationIdentifier: string): Promise<EnergyReading> {
    const station = await stationService.resolveStation(stationIdentifier);
    const latest = await energyRepository.findLatestByStationId(station.id);

    if (!latest) {
      throw ApiError.notFound(
        `No energy readings available for station '${station.code}'`,
        "NO_ENERGY_DATA"
      );
    }

    return latest;
  }

  /**
   * Retrieves paginated historical energy generation/consumption series
   */
  async getEnergyHistory(
    stationIdentifier: string,
    query: EnergyHistoryQuery
  ): Promise<PaginatedResult<EnergyReading>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    const [items, total] = await Promise.all([
      energyRepository.findHistory(station.id, {
        page: query.page,
        limit: query.limit,
        from: fromDate,
        to: toDate
      }),
      energyRepository.countHistory(station.id, {
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

export const energyService = new EnergyService();
