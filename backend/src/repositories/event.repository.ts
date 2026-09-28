import { OperationalEvent, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";
import { PaginationParams, DateRangeFilter } from "../types/pagination.types";

export interface EventFilterOptions {
  type?: string;
}

export class EventRepository {
  /**
   * Retrieves paginated chronological operational timeline events
   */
  async findByStationId(
    stationId: string,
    options: PaginationParams & DateRangeFilter & EventFilterOptions
  ): Promise<OperationalEvent[]> {
    try {
      const where: Prisma.OperationalEventWhereInput = {
        stationId,
        ...(options.type && { type: options.type }),
        ...(options.from || options.to
          ? {
              occurredAt: {
                ...(options.from && { gte: options.from }),
                ...(options.to && { lte: options.to })
              }
            }
          : {})
      };

      const skip = (options.page - 1) * options.limit;

      return await prisma.operationalEvent.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: options.limit
      });
    } catch (error) {
      handleDbError(error, "OperationalEvents");
    }
  }

  /**
   * Counts events matching filter criteria
   */
  async countByStationId(
    stationId: string,
    filter?: DateRangeFilter & EventFilterOptions
  ): Promise<number> {
    try {
      const where: Prisma.OperationalEventWhereInput = {
        stationId,
        ...(filter?.type && { type: filter.type }),
        ...(filter?.from || filter?.to
          ? {
              occurredAt: {
                ...(filter?.from && { gte: filter.from }),
                ...(filter?.to && { lte: filter.to })
              }
            }
          : {})
      };

      return await prisma.operationalEvent.count({ where });
    } catch (error) {
      handleDbError(error, "OperationalEventsCount");
    }
  }
}

export const eventRepository = new EventRepository();
