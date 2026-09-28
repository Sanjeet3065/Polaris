import { OperationalEvent } from "@prisma/client";
import { eventRepository } from "../repositories/event.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";

export interface EventQuery {
  page: number;
  limit: number;
  type?: string;
  from?: string;
  to?: string;
}

export class EventService {
  /**
   * Retrieves chronological operational timeline events for a station
   */
  async getEventsByStation(
    stationIdentifier: string,
    query: EventQuery
  ): Promise<PaginatedResult<OperationalEvent>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    const [items, total] = await Promise.all([
      eventRepository.findByStationId(station.id, {
        page: query.page,
        limit: query.limit,
        type: query.type,
        from: fromDate,
        to: toDate
      }),
      eventRepository.countByStationId(station.id, {
        type: query.type,
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

export const eventService = new EventService();
