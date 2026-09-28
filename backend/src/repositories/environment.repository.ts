import { EnvironmentalReading, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams, DateRangeFilter } from "../types/pagination.types";

export class EnvironmentRepository {
  /**
   * Retrieves the latest atmospheric and environmental measurement
   */
  async findLatestByStationId(stationId: string): Promise<EnvironmentalReading | null> {
    try {
      return await prisma.environmentalReading.findFirst({
        where: { stationId },
        orderBy: { recordedAt: "desc" }
      });
    } catch (error) {
      handleDbError(error, "EnvironmentalReading");
    }
  }

  /**
   * Retrieves paginated environmental observation series
   */
  async findHistory(
    stationId: string,
    options: PaginationParams & DateRangeFilter
  ): Promise<EnvironmentalReading[]> {
    try {
      const where: Prisma.EnvironmentalReadingWhereInput = {
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

      return await prisma.environmentalReading.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "EnvironmentalReadingHistory");
    }
  }

  /**
   * Counts total environmental records for pagination
   */
  async countHistory(stationId: string, filter?: DateRangeFilter): Promise<number> {
    try {
      const where: Prisma.EnvironmentalReadingWhereInput = {
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

      return await prisma.environmentalReading.count({ where });
    } catch (error) {
      handleDbError(error, "EnvironmentalReadingCount");
    }
  }
}

export const environmentRepository = new EnvironmentRepository();
