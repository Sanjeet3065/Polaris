import { Alert, AlertSeverity, AlertStatus } from "@prisma/client";
import { alertRepository } from "../repositories/alert.repository";
import { stationService } from "./station.service";
import { PaginatedResult } from "../types/pagination.types";
import { ApiError } from "../utils/apiError";

export interface AlertQuery {
  page: number;
  limit: number;
  severity?: AlertSeverity;
  status?: AlertStatus;
}

export class AlertService {
  /**
   * Retrieves paginated alerts for a station
   */
  async getAlertsByStation(
    stationIdentifier: string,
    query: AlertQuery
  ): Promise<PaginatedResult<Alert>> {
    const station = await stationService.resolveStation(stationIdentifier);

    const [items, total] = await Promise.all([
      alertRepository.findByStationId(station.id, {
        page: query.page,
        limit: query.limit,
        severity: query.severity,
        status: query.status
      }),
      alertRepository.countByStationId(station.id, {
        severity: query.severity,
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
   * Retrieves single alert details
   */
  async getAlertDetails(id: string): Promise<Alert> {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      throw ApiError.notFound(`Alert with ID '${id}' was not found`, "ALERT_NOT_FOUND");
    }
    return alert;
  }
}

export const alertService = new AlertService();
