import { Station } from "@prisma/client";
import { stationRepository } from "../repositories/station.repository";
import { ApiError } from "../utils/apiError";

export class StationService {
  /**
   * Retrieves all registered Antarctic research stations
   */
  async getAllStations(): Promise<Station[]> {
    return await stationRepository.findAll();
  }

  /**
   * Resolves a station by UUID or Station Code (e.g. MAITRI, BHARATI).
   * Throws 404 NOT_FOUND if station does not exist.
   */
  async resolveStation(idOrCode: string): Promise<Station> {
    const station = await stationRepository.findByIdOrCode(idOrCode);
    if (!station) {
      throw ApiError.notFound(
        `Station with identifier '${idOrCode}' was not found. Valid codes are MAITRI, BHARATI.`,
        "STATION_NOT_FOUND"
      );
    }
    return station;
  }

  /**
   * Retrieves station details by UUID or station code
   */
  async getStationByIdOrCode(idOrCode: string): Promise<Station> {
    return await this.resolveStation(idOrCode);
  }
}

export const stationService = new StationService();
