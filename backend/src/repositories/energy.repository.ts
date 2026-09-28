import { EnergyReading, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams, DateRangeFilter } from "../types/pagination.types";

export class EnergyRepository {
  /**
   * Retrieves the most recent energy telemetry reading for a station
   */
  async findLatestByStationId(stationId: string): Promise<EnergyReading | null> {
    try {
      return await prisma.energyReading.findFirst({
        where: { stationId },
        orderBy: { recordedAt: "desc" }
      });
    } catch (error) {
      handleDbError(error, "EnergyReading");
    }
  }

  /**
   * Retrieves paginated historical energy readings with optional date window
   */
  async findHistory(
    stationId: string,
    options: PaginationParams & DateRangeFilter
  ): Promise<EnergyReading[]> {
    try {
      const where: Prisma.EnergyReadingWhereInput = {
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

      return await prisma.energyReading.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "EnergyReadingHistory");
    }
  }

  /**
   * Counts total energy records matching date bounds
   */
  async countHistory(stationId: string, filter?: DateRangeFilter): Promise<number> {
    try {
      const where: Prisma.EnergyReadingWhereInput = {
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

      return await prisma.energyReading.count({ where });
    } catch (error) {
      handleDbError(error, "EnergyReadingCount");
    }
  }
}

export const energyRepository = new EnergyRepository();
