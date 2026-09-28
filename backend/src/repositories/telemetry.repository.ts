import { StationTelemetry, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams, DateRangeFilter } from "../types/pagination.types";

export class TelemetryRepository {
  /**
   * Retrieves the most recent telemetry observation for a station
   */
  async findLatestByStationId(stationId: string): Promise<StationTelemetry | null> {
    try {
      return await prisma.stationTelemetry.findFirst({
        where: { stationId },
        orderBy: { recordedAt: "desc" }
      });
    } catch (error) {
      handleDbError(error, "StationTelemetry");
    }
  }

  /**
   * Retrieves paginated historical telemetry observations
   */
  async findHistory(
    stationId: string,
    options: PaginationParams & DateRangeFilter
  ): Promise<StationTelemetry[]> {
    try {
      const where: Prisma.StationTelemetryWhereInput = {
        stationId,
        ...(options.from || options.to
          ? {
              recordedAt: {
                ...(options.from && { gte: options.from }),
                ...(options.to && { lte: options.to })
              }
            }
          : {})
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.stationTelemetry.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "StationTelemetryHistory");
    }
  }

  /**
   * Counts historical telemetry records matching filter criteria
   */
  async countHistory(stationId: string, filter?: DateRangeFilter): Promise<number> {
    try {
      const where: Prisma.StationTelemetryWhereInput = {
        stationId,
        ...(filter?.from || filter?.to
          ? {
              recordedAt: {
                ...(filter.from && { gte: filter.from }),
                ...(filter.to && { lte: filter.to })
              }
            }
          : {})
      };

      return await prisma.stationTelemetry.count({ where });
    } catch (error) {
      handleDbError(error, "StationTelemetryCount");
    }
  }
}

export const telemetryRepository = new TelemetryRepository();
