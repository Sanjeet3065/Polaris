import { prisma } from "../../config/prisma";
import { GeneratedTelemetryCycle } from "../models/simulator.types";
import { logger } from "../../utils/logger";

export class TelemetryPersistenceService {
  /**
   * Persists a complete generated telemetry cycle for a station atomically using a Prisma transaction
   */
  async persistCycle(cycle: GeneratedTelemetryCycle): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Insert StationTelemetry record
        await tx.stationTelemetry.create({
          data: {
            stationId: cycle.stationTelemetry.stationId,
            recordedAt: cycle.stationTelemetry.recordedAt,
            temperature: cycle.stationTelemetry.temperature,
            humidity: cycle.stationTelemetry.humidity,
            pressure: cycle.stationTelemetry.pressure,
            windSpeed: cycle.stationTelemetry.windSpeed,
            windDirection: cycle.stationTelemetry.windDirection,
            visibility: cycle.stationTelemetry.visibility
          }
        });

        // 2. Insert EnvironmentalReading record
        await tx.environmentalReading.create({
          data: {
            stationId: cycle.environmentalReading.stationId,
            recordedAt: cycle.environmentalReading.recordedAt,
            temperature: cycle.environmentalReading.temperature,
            humidity: cycle.environmentalReading.humidity,
            pressure: cycle.environmentalReading.pressure,
            windSpeed: cycle.environmentalReading.windSpeed,
            windDirection: cycle.environmentalReading.windDirection,
            windDirectionCompass: cycle.environmentalReading.windDirectionCompass,
            visibility: cycle.environmentalReading.visibility,
            solarRadiation: cycle.environmentalReading.solarRadiation,
            snowfallRate: cycle.environmentalReading.snowfallRate,
            status: cycle.environmentalReading.status
          }
        });

        // 3. Insert EnergyReading record
        await tx.energyReading.create({
          data: {
            stationId: cycle.energyReading.stationId,
            recordedAt: cycle.energyReading.recordedAt,
            generationKw: cycle.energyReading.generationKw,
            solarKw: cycle.energyReading.solarKw,
            dieselKw: cycle.energyReading.dieselKw,
            consumptionKw: cycle.energyReading.consumptionKw,
            netPowerKw: cycle.energyReading.netPowerKw,
            batteryPercent: cycle.energyReading.batteryPercent,
            batteryVoltage: cycle.energyReading.batteryVoltage,
            fuelPercent: cycle.energyReading.fuelPercent,
            fuelLiters: cycle.energyReading.fuelLiters,
            fuelDaysRemaining: cycle.energyReading.fuelDaysRemaining
          }
        });

        // 4. Batch insert EquipmentHealth records
        if (cycle.equipmentHealth.length > 0) {
          await tx.equipmentHealth.createMany({
            data: cycle.equipmentHealth.map((eh) => ({
              equipmentId: eh.equipmentId,
              recordedAt: eh.recordedAt,
              healthPercent: eh.healthPercent,
              temperature: eh.temperature,
              vibration: eh.vibration,
              runtimeHours: eh.runtimeHours,
              status: eh.status,
              notes: eh.notes
            }))
          });

          // 5. Update latest equipment health and status on the Equipment master rows
          for (const eh of cycle.equipmentHealth) {
            await tx.equipment.update({
              where: { id: eh.equipmentId },
              data: {
                healthPercent: eh.healthPercent,
                status: eh.status
              }
            });
          }
        }

        // 6. Update station composite health and status
        await tx.station.update({
          where: { id: cycle.stationId },
          data: {
            healthPercent: cycle.stationHealthPercent,
            status: cycle.stationStatus
          }
        });
      });
    } catch (error) {
      logger.error("DB_PERSISTENCE_ERROR: Failed to persist telemetry cycle", error as Error, {
        stationId: cycle.stationId,
        stationCode: cycle.stationCode,
        timestamp: cycle.timestamp.toISOString()
      });
      throw error;
    }
  }
}

export const telemetryPersistenceService = new TelemetryPersistenceService();
