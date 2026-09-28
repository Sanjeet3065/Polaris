import { StationTelemetry } from "@prisma/client";
import { telemetryRepository } from "../repositories/telemetry.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";

export interface TelemetryHistoryQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
}

export class TelemetryService {
  /**
   * Retrieves the most recent telemetry packet for a station
   */
  async getLatestTelemetry(stationIdentifier: string): Promise<StationTelemetry> {
    const station = await stationService.resolveStation(stationIdentifier);
    const latest = await telemetryRepository.findLatestByStationId(station.id);

    if (!latest) {
      throw ApiError.notFound(
        `No telemetry records available for station '${station.code}'`,
        "NO_TELEMETRY_DATA"
      );
    }

    return latest;
  }

  /**
   * Retrieves paginated historical telemetry with optional date bounds
   */
  async getTelemetryHistory(
    stationIdentifier: string,
    query: TelemetryHistoryQuery
  ): Promise<PaginatedResult<StationTelemetry>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    const [items, total] = await Promise.all([
      telemetryRepository.findHistory(station.id, {
        page: query.page,
        limit: query.limit,
        from: fromDate,
        to: toDate
      }),
      telemetryRepository.countHistory(station.id, {
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

export const telemetryService = new TelemetryService();
