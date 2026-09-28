import { Station } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";

export class StationRepository {
  /**
   * Retrieves all research stations
   */
  async findAll(): Promise<Station[]> {
    try {
      return await prisma.station.findMany({
        orderBy: { code: "asc" }
      });
    } catch (error) {
      handleDbError(error, "Stations");
    }
  }

  /**
   * Retrieves a station by its primary UUID
   */
  async findById(id: string): Promise<Station | null> {
    try {
      return await prisma.station.findUnique({
        where: { id }
      });
    } catch (error) {
      handleDbError(error, "Station");
    }
  }

  /**
   * Retrieves a station by unique station code (e.g. MAITRI, BHARATI)
   */
  async findByCode(code: string): Promise<Station | null> {
    try {
      return await prisma.station.findUnique({
        where: { code: code.toUpperCase() }
      });
    } catch (error) {
      handleDbError(error, "Station");
    }
  }

  /**
   * Finds a station by either its UUID or unique code
   */
  async findByIdOrCode(idOrCode: string): Promise<Station | null> {
    try {
      // First try by unique code (case-insensitive uppercase)
      const byCode = await prisma.station.findUnique({
        where: { code: idOrCode.toUpperCase() }
      });
      if (byCode) return byCode;

      // If not code, try by UUID
      return await prisma.station.findUnique({
        where: { id: idOrCode }
      });
    } catch (error) {
      handleDbError(error, "Station");
    }
  }
}

export const stationRepository = new StationRepository();
