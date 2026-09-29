import http from "http";
import crypto from "crypto";
import { polarisWebSocketServer } from "./websocket/websocket.server";
import { webSocketRegistry } from "./websocket/websocket.registry";
import { realtimeEventBus } from "./events/realtime.eventbus";
import { sequenceManager } from "./events/sequence.manager";
import {
  EventEnvelope,
  REALTIME_EVENT_TYPES,
  TelemetryUpdatePayload,
  AlertTriggeredPayload,
  ScenarioActivePayload,
  EquipmentUpdatePayload,
  StationStatusPayload,
  RealtimeMetrics
} from "./events/realtime.types";
import { GeneratedTelemetryCycle, StationCode } from "../simulator/models/simulator.types";
import { logger } from "../utils/logger";

/**
 * Realtime Service Facade (Sections 3, 4, 36)
 * Orchestrates event publishing, metrics collection, and server lifecycle.
 */
export class RealtimeService {
  private static instance: RealtimeService;

  // Alert deduplication memory cache (Section 24)
  // Maps key: `${stationCode}:${category}:${title}` -> triggered timestamp
  private recentAlertsCache = new Map<string, number>();
  private readonly ALERT_DEDUP_WINDOW_MS = 60000; // 60 seconds

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Initializes the WebSocket real-time transport layer on the HTTP server
   */
  public initialize(server: http.Server): void {
    polarisWebSocketServer.initialize(server);
  }

  /**
   * Transforms a generated, persisted telemetry cycle into a compact frontend DTO
   * and publishes it onto the RealtimeEventBus (Section 6 & 22)
   */
  public publishTelemetryCycle(cycle: GeneratedTelemetryCycle): void {
    try {
      const sequence = sequenceManager.nextSequence(cycle.stationCode);

      const payload: TelemetryUpdatePayload = {
        stationId: cycle.stationId,
        stationCode: cycle.stationCode,
        timestamp: cycle.timestamp.toISOString(),
        environment: {
          temperature: cycle.environmentalReading.temperature,
          humidity: cycle.environmentalReading.humidity,
          pressure: cycle.environmentalReading.pressure,
          windSpeed: cycle.environmentalReading.windSpeed,
          windDirection: cycle.environmentalReading.windDirection,
          windDirectionCompass: cycle.environmentalReading.windDirectionCompass,
          visibility: cycle.environmentalReading.visibility,
          solarRadiation: cycle.environmentalReading.solarRadiation,
          snowfallRate: cycle.environmentalReading.snowfallRate
        },
        energy: {
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
        },
        station: {
          healthPercent: cycle.stationHealthPercent,
          status: cycle.stationStatus
        },
        equipmentSummary: cycle.equipmentHealth.map((eh) => ({
          equipmentId: eh.equipmentId,
          healthPercent: eh.healthPercent,
          status: eh.status,
          temperature: eh.temperature,
          vibration: eh.vibration,
          runtimeHours: eh.runtimeHours,
          notes: eh.notes
        }))
      };

      const envelope: EventEnvelope<TelemetryUpdatePayload> = {
        type: REALTIME_EVENT_TYPES.TELEMETRY_UPDATE,
        eventId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        stationId: cycle.stationId,
        stationCode: cycle.stationCode,
        sequence,
        data: payload
      };

      realtimeEventBus.publish(envelope);
    } catch (err) {
      logger.error("REALTIME_PUBLISH_TELEMETRY_ERROR: Failed to construct telemetry event envelope", err as Error, {
        stationCode: cycle.stationCode
      });
    }
  }

  /**
   * Publishes telemetry payload directly (for testing and synthetic events)
   */
  public publishTelemetry(payload: TelemetryUpdatePayload): void {
    const sequence = sequenceManager.nextSequence(payload.stationCode);
    const envelope: EventEnvelope<TelemetryUpdatePayload> = {
      type: REALTIME_EVENT_TYPES.TELEMETRY_UPDATE,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationId: payload.stationId,
      stationCode: payload.stationCode,
      sequence,
      data: payload
    };

    realtimeEventBus.publish(envelope);
  }

  /**
   * Publishes an alert event with threshold transition deduplication (Section 24)
   */
  public publishAlert(alert: AlertTriggeredPayload): boolean {
    const dedupKey = `${alert.stationCode}:${alert.category}:${alert.title}`;
    const now = Date.now();
    const lastTriggered = this.recentAlertsCache.get(dedupKey);

    if (lastTriggered && now - lastTriggered < this.ALERT_DEDUP_WINDOW_MS) {
      // Deduplicate: Don't spam identical alert within the window
      return false;
    }

    this.recentAlertsCache.set(dedupKey, now);

    const envelope: EventEnvelope<AlertTriggeredPayload> = {
      type: REALTIME_EVENT_TYPES.ALERT_TRIGGERED,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationId: alert.stationId,
      stationCode: alert.stationCode,
      sequence: sequenceManager.nextSequence(alert.stationCode),
      data: alert
    };

    realtimeEventBus.publish(envelope);
    return true;
  }

  /**
   * Publishes a simulation scenario change event (Section 25)
   */
  public publishScenario(scenario: ScenarioActivePayload): void {
    const envelope: EventEnvelope<ScenarioActivePayload> = {
      type: REALTIME_EVENT_TYPES.SCENARIO_ACTIVE,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationCode: scenario.stationCode,
      sequence: sequenceManager.nextSequence(scenario.stationCode),
      data: scenario
    };

    realtimeEventBus.publish(envelope);
  }

  public publishScenarioActive(scenario: ScenarioActivePayload): void {
    this.publishScenario(scenario);
  }

  /**
   * Publishes an equipment state change event (Section 26)
   */
  public publishEquipment(equipment: EquipmentUpdatePayload): void {
    const envelope: EventEnvelope<EquipmentUpdatePayload> = {
      type: REALTIME_EVENT_TYPES.EQUIPMENT_UPDATE,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationCode: equipment.stationCode,
      sequence: sequenceManager.nextSequence(equipment.stationCode),
      data: equipment
    };

    realtimeEventBus.publish(envelope);
  }

  public publishEquipmentUpdate(equipment: EquipmentUpdatePayload): void {
    this.publishEquipment(equipment);
  }

  /**
   * Publishes a station operational status change event (Section 27)
   */
  public publishStationStatus(status: StationStatusPayload): void {
    const envelope: EventEnvelope<StationStatusPayload> = {
      type: REALTIME_EVENT_TYPES.STATION_STATUS,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationId: status.stationId,
      stationCode: status.stationCode,
      sequence: sequenceManager.nextSequence(status.stationCode),
      data: status
    };

    realtimeEventBus.publish(envelope);
  }

  /**
   * Retrieves live metrics for monitoring (Section 36)
   */
  public getMetrics(): RealtimeMetrics {
    return webSocketRegistry.getMetrics();
  }

  /**
   * Graceful shutdown of the realtime subsystem
   */
  public async shutdown(): Promise<void> {
    this.recentAlertsCache.clear();
    await polarisWebSocketServer.shutdown();
  }
}

export const realtimeService = RealtimeService.getInstance();
