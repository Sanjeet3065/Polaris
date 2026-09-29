import { Alert, AlertSeverity, AlertStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { alertRepository } from "../repositories/alert.repository";
import { realtimeService } from "../realtime/realtime.service";
import { REALTIME_EVENT_TYPES } from "../realtime/events/realtime.types";
import { ALERT_RULE_CODES, ALERT_THRESHOLDS, isHigherSeverity } from "../utils/alertRules";
import { StationCode, GeneratedTelemetryCycle } from "../simulator/models/simulator.types";
import { logger } from "../utils/logger";

export interface AlertCandidate {
  stationId: string;
  stationCode: StationCode;
  equipmentId?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  sourceType: string; // ENERGY, ENVIRONMENT, EQUIPMENT, INVENTORY, LOGISTICS
  sourceId?: string; // equipment code, item SKU, or sensor metric
  ruleCode: string;
  triggerValue?: number;
  thresholdValue?: number;
  unit?: string;
  metadata?: string;
}

export class AlertEvaluationService {
  /**
   * Main entrypoint for evaluating a full simulated telemetry cycle (IoT Simulator)
   */
  public async evaluateTelemetryCycle(cycle: GeneratedTelemetryCycle): Promise<Alert[]> {
    const alertsGenerated: Alert[] = [];

    try {
      // 1. Evaluate Environmental Telemetry
      const envAlerts = await this.evaluateEnvironmentalTelemetry(cycle);
      alertsGenerated.push(...envAlerts);

      // 2. Evaluate Energy Telemetry
      const energyAlerts = await this.evaluateEnergyTelemetry(cycle);
      alertsGenerated.push(...energyAlerts);

      // 3. Evaluate Equipment Health Telemetry
      const equipAlerts = await this.evaluateEquipmentTelemetry(cycle);
      alertsGenerated.push(...equipAlerts);
    } catch (error) {
      logger.error("[AlertEvaluationService] Error evaluating telemetry cycle:", error instanceof Error ? error : new Error(String(error)));
    }

    return alertsGenerated;
  }

  /**
   * Evaluates Environmental Readings
   */
  public async evaluateEnvironmentalTelemetry(cycle: GeneratedTelemetryCycle): Promise<Alert[]> {
    const { environmentalReading: env, stationId, stationCode } = cycle;
    const alerts: Alert[] = [];

    // --- A. Wind Speed ---
    if (env.windSpeed > ALERT_THRESHOLDS.ENVIRONMENT.WIND_BLIZZARD_GALE_KMH) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.CRITICAL,
        title: "Katabatic Blizzard Gale Exceeded",
        message: `Dangerous wind velocity recorded at ${env.windSpeed.toFixed(1)} km/h (Threshold: >120 km/h)`,
        sourceType: "ENVIRONMENT",
        sourceId: "windSpeed",
        ruleCode: ALERT_RULE_CODES.ENV_WIND_BLIZZARD_GALE,
        triggerValue: env.windSpeed,
        thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.WIND_BLIZZARD_GALE_KMH,
        unit: "km/h"
      });
      alerts.push(alert);
    } else if (env.windSpeed > ALERT_THRESHOLDS.ENVIRONMENT.WIND_HIGH_KMH) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.HIGH,
        title: "High Wind Velocity Warning",
        message: `High wind velocity recorded at ${env.windSpeed.toFixed(1)} km/h (Threshold: >80 km/h)`,
        sourceType: "ENVIRONMENT",
        sourceId: "windSpeed",
        ruleCode: ALERT_RULE_CODES.ENV_WIND_HIGH,
        triggerValue: env.windSpeed,
        thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.WIND_HIGH_KMH,
        unit: "km/h"
      });
      alerts.push(alert);
    } else if (env.windSpeed < ALERT_THRESHOLDS.ENVIRONMENT.WIND_HIGH_RECOVERY) {
      // Auto-resolution hysteresis for wind
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENV_WIND_HIGH,
        `Wind speed subsided to ${env.windSpeed.toFixed(1)} km/h (below recovery threshold of 75 km/h)`
      );
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENV_WIND_BLIZZARD_GALE,
        `Wind speed subsided to ${env.windSpeed.toFixed(1)} km/h`
      );
    }

    // --- B. Ambient Temperature ---
    if (env.temperature <= ALERT_THRESHOLDS.ENVIRONMENT.TEMP_EXTREME_COLD_C) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.CRITICAL,
        title: "Extreme Polar Hypothermia Hazard",
        message: `Severe sub-zero thermal excursion: ${env.temperature.toFixed(1)} °C (Threshold: <= -55 °C)`,
        sourceType: "ENVIRONMENT",
        sourceId: "temperature",
        ruleCode: ALERT_RULE_CODES.ENV_TEMP_EXTREME_COLD,
        triggerValue: env.temperature,
        thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.TEMP_EXTREME_COLD_C,
        unit: "°C"
      });
      alerts.push(alert);
    } else if (env.temperature <= ALERT_THRESHOLDS.ENVIRONMENT.TEMP_LOW_WARNING_C) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.MEDIUM,
        title: "Severe Cold Warning",
        message: `Ambient temperature reached ${env.temperature.toFixed(1)} °C (Threshold: <= -40 °C)`,
        sourceType: "ENVIRONMENT",
        sourceId: "temperature",
        ruleCode: ALERT_RULE_CODES.ENV_TEMP_LOW_WARNING,
        triggerValue: env.temperature,
        thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.TEMP_LOW_WARNING_C,
        unit: "°C"
      });
      alerts.push(alert);
    } else if (env.temperature > ALERT_THRESHOLDS.ENVIRONMENT.TEMP_LOW_RECOVERY) {
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENV_TEMP_EXTREME_COLD,
        `Temperature recovered to ${env.temperature.toFixed(1)} °C`
      );
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENV_TEMP_LOW_WARNING,
        `Temperature recovered to ${env.temperature.toFixed(1)} °C`
      );
    }

    // --- C. Visibility Whiteout ---
    if (env.visibility < ALERT_THRESHOLDS.ENVIRONMENT.VISIBILITY_WHITEOUT_KM) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.CRITICAL,
        title: "Antarctic Whiteout Conditions",
        message: `Severe optical visibility impairment: ${env.visibility.toFixed(2)} km (Threshold: < 1.0 km)`,
        sourceType: "ENVIRONMENT",
        sourceId: "visibility",
        ruleCode: ALERT_RULE_CODES.ENV_VISIBILITY_WHITEOUT,
        triggerValue: env.visibility,
        thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.VISIBILITY_WHITEOUT_KM,
        unit: "km"
      });
      alerts.push(alert);
    } else if (env.visibility >= ALERT_THRESHOLDS.ENVIRONMENT.VISIBILITY_WHITEOUT_RECOVERY) {
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENV_VISIBILITY_WHITEOUT,
        `Visibility restored to ${env.visibility.toFixed(1)} km`
      );
    }

    // --- D. Barometric Pressure Drop ---
    if (env.pressure < ALERT_THRESHOLDS.ENVIRONMENT.PRESSURE_STORM_DROP_HPA) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.HIGH,
        title: "Severe Cyclonic Pressure Drop",
        message: `Barometric pressure plummeted to ${env.pressure.toFixed(1)} hPa (Threshold: < 955 hPa)`,
        sourceType: "ENVIRONMENT",
        sourceId: "pressure",
        ruleCode: ALERT_RULE_CODES.ENV_PRESSURE_STORM_DROP,
        triggerValue: env.pressure,
        thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.PRESSURE_STORM_DROP_HPA,
        unit: "hPa"
      });
      alerts.push(alert);
    } else if (env.pressure >= ALERT_THRESHOLDS.ENVIRONMENT.PRESSURE_STORM_RECOVERY) {
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENV_PRESSURE_STORM_DROP,
        `Barometric pressure normalized to ${env.pressure.toFixed(1)} hPa`
      );
    }

    return alerts;
  }

  /**
   * Evaluates Energy & Microgrid Readings
   */
  public async evaluateEnergyTelemetry(cycle: GeneratedTelemetryCycle): Promise<Alert[]> {
    const { energyReading: energy, stationId, stationCode } = cycle;
    const alerts: Alert[] = [];

    // --- A. Battery State-of-Charge (SoC) ---
    if (energy.batteryPercent <= ALERT_THRESHOLDS.ENERGY.BATTERY_CRITICAL_SOC) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.CRITICAL,
        title: "Main Battery Bank Depleted",
        message: `Energy storage reserve critical: ${energy.batteryPercent.toFixed(1)}% SoC remaining (Threshold: <= 20%)`,
        sourceType: "ENERGY",
        sourceId: "batteryPercent",
        ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL,
        triggerValue: energy.batteryPercent,
        thresholdValue: ALERT_THRESHOLDS.ENERGY.BATTERY_CRITICAL_SOC,
        unit: "%"
      });
      alerts.push(alert);
    } else if (energy.batteryPercent <= ALERT_THRESHOLDS.ENERGY.BATTERY_LOW_SOC) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.HIGH,
        title: "Battery Storage Level Low",
        message: `Battery SoC low: ${energy.batteryPercent.toFixed(1)}% (Threshold: <= 35%)`,
        sourceType: "ENERGY",
        sourceId: "batteryPercent",
        ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_LOW,
        triggerValue: energy.batteryPercent,
        thresholdValue: ALERT_THRESHOLDS.ENERGY.BATTERY_LOW_SOC,
        unit: "%"
      });
      alerts.push(alert);
    } else if (energy.batteryPercent >= ALERT_THRESHOLDS.ENERGY.BATTERY_LOW_RECOVERY) {
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL,
        `Battery SoC recharged to ${energy.batteryPercent.toFixed(1)}%`
      );
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENERGY_BATTERY_LOW,
        `Battery SoC recharged to ${energy.batteryPercent.toFixed(1)}%`
      );
    }

    // --- B. Battery Voltage ---
    if (energy.batteryVoltage < ALERT_THRESHOLDS.ENERGY.BATTERY_VOLTAGE_CRITICAL) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.CRITICAL,
        title: "Battery Bus Undervoltage Excursion",
        message: `DC Bus voltage dropped to ${energy.batteryVoltage.toFixed(1)} V (Threshold: < 460 V)`,
        sourceType: "ENERGY",
        sourceId: "batteryVoltage",
        ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_VOLTAGE_CRITICAL,
        triggerValue: energy.batteryVoltage,
        thresholdValue: ALERT_THRESHOLDS.ENERGY.BATTERY_VOLTAGE_CRITICAL,
        unit: "V"
      });
      alerts.push(alert);
    } else if (energy.batteryVoltage >= ALERT_THRESHOLDS.ENERGY.BATTERY_VOLTAGE_RECOVERY) {
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENERGY_BATTERY_VOLTAGE_CRITICAL,
        `Battery bus voltage normalized to ${energy.batteryVoltage.toFixed(1)} V`
      );
    }

    // --- C. Reserve Fuel Autonomy ---
    if (
      energy.fuelPercent <= ALERT_THRESHOLDS.ENERGY.FUEL_CRITICAL_PERCENT ||
      energy.fuelDaysRemaining <= ALERT_THRESHOLDS.ENERGY.FUEL_CRITICAL_DAYS
    ) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.CRITICAL,
        title: "Fuel Reserves Critically Depleted",
        message: `Fuel storage down to ${energy.fuelPercent.toFixed(1)}% (${energy.fuelDaysRemaining.toFixed(0)} days autonomy left)`,
        sourceType: "ENERGY",
        sourceId: "fuelPercent",
        ruleCode: ALERT_RULE_CODES.ENERGY_FUEL_CRITICAL,
        triggerValue: energy.fuelPercent,
        thresholdValue: ALERT_THRESHOLDS.ENERGY.FUEL_CRITICAL_PERCENT,
        unit: "%"
      });
      alerts.push(alert);
    } else if (energy.fuelPercent <= ALERT_THRESHOLDS.ENERGY.FUEL_LOW_PERCENT) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.MEDIUM,
        title: "Station Fuel Reserve Warning",
        message: `Fuel reserve at ${energy.fuelPercent.toFixed(1)}% capacity (${energy.fuelDaysRemaining.toFixed(0)} days)`,
        sourceType: "ENERGY",
        sourceId: "fuelPercent",
        ruleCode: ALERT_RULE_CODES.ENERGY_FUEL_LOW,
        triggerValue: energy.fuelPercent,
        thresholdValue: ALERT_THRESHOLDS.ENERGY.FUEL_LOW_PERCENT,
        unit: "%"
      });
      alerts.push(alert);
    } else if (energy.fuelPercent >= ALERT_THRESHOLDS.ENERGY.FUEL_LOW_RECOVERY_PERCENT) {
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENERGY_FUEL_CRITICAL,
        `Fuel replenished to ${energy.fuelPercent.toFixed(1)}%`
      );
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENERGY_FUEL_LOW,
        `Fuel replenished to ${energy.fuelPercent.toFixed(1)}%`
      );
    }

    // --- D. Net Power Deficit ---
    if (energy.netPowerKw < ALERT_THRESHOLDS.ENERGY.POWER_DEFICIT_CRITICAL_KW) {
      const { alert } = await this.upsertAlert({
        stationId,
        stationCode,
        severity: AlertSeverity.CRITICAL,
        title: "Severe Microgrid Power Shortage",
        message: `Severe generation deficit: ${energy.netPowerKw.toFixed(1)} kW (Threshold: < -50 kW)`,
        sourceType: "ENERGY",
        sourceId: "netPowerKw",
        ruleCode: ALERT_RULE_CODES.ENERGY_POWER_SHORTAGE_CRITICAL,
        triggerValue: energy.netPowerKw,
        thresholdValue: ALERT_THRESHOLDS.ENERGY.POWER_DEFICIT_CRITICAL_KW,
        unit: "kW"
      });
      alerts.push(alert);
    } else if (energy.netPowerKw >= ALERT_THRESHOLDS.ENERGY.POWER_DEFICIT_RECOVERY_KW) {
      await this.autoResolveAlert(
        stationId,
        stationCode,
        ALERT_RULE_CODES.ENERGY_POWER_SHORTAGE_CRITICAL,
        `Power balance stabilized to ${energy.netPowerKw.toFixed(1)} kW`
      );
    }

    return alerts;
  }

  /**
   * Evaluates Machinery Diagnostic Health Telemetry
   */
  public async evaluateEquipmentTelemetry(cycle: GeneratedTelemetryCycle): Promise<Alert[]> {
    const { equipmentHealth, stationId, stationCode } = cycle;
    const alerts: Alert[] = [];

    for (const eh of equipmentHealth) {
      // 1. Operating Temperature Overheat
      if (eh.temperature && eh.temperature > ALERT_THRESHOLDS.EQUIPMENT.TEMPERATURE_CRITICAL_C) {
        const { alert } = await this.upsertAlert({
          stationId,
          stationCode,
          equipmentId: eh.equipmentId,
          severity: AlertSeverity.CRITICAL,
          title: `Equipment ${eh.equipmentId.slice(0, 8)} Thermal Overheat Critical`,
          message: `Internal core temperature exceeded ${eh.temperature.toFixed(1)} °C (Threshold: >95 °C)`,
          sourceType: "EQUIPMENT",
          sourceId: eh.equipmentId,
          ruleCode: ALERT_RULE_CODES.EQUIPMENT_OVERHEAT_CRITICAL,
          triggerValue: eh.temperature,
          thresholdValue: ALERT_THRESHOLDS.EQUIPMENT.TEMPERATURE_CRITICAL_C,
          unit: "°C"
        });
        alerts.push(alert);
      } else if (eh.temperature && eh.temperature < ALERT_THRESHOLDS.EQUIPMENT.TEMPERATURE_CRITICAL_RECOVERY) {
        await this.autoResolveAlert(
          stationId,
          stationCode,
          ALERT_RULE_CODES.EQUIPMENT_OVERHEAT_CRITICAL,
          `Temperature cooled down to ${eh.temperature.toFixed(1)} °C`,
          eh.equipmentId
        );
      }

      // 2. Vibration Excursion
      if (eh.vibration && eh.vibration > ALERT_THRESHOLDS.EQUIPMENT.VIBRATION_CRITICAL_MMS) {
        const { alert } = await this.upsertAlert({
          stationId,
          stationCode,
          equipmentId: eh.equipmentId,
          severity: AlertSeverity.CRITICAL,
          title: `Bearing Vibration Excursion Critical`,
          message: `Mechanical vibration RMS peaked at ${eh.vibration.toFixed(2)} mm/s (Threshold: >7.0 mm/s)`,
          sourceType: "EQUIPMENT",
          sourceId: eh.equipmentId,
          ruleCode: ALERT_RULE_CODES.EQUIPMENT_VIBRATION_CRITICAL,
          triggerValue: eh.vibration,
          thresholdValue: ALERT_THRESHOLDS.EQUIPMENT.VIBRATION_CRITICAL_MMS,
          unit: "mm/s"
        });
        alerts.push(alert);
      }

      // 3. Health Index
      if (eh.healthPercent < ALERT_THRESHOLDS.EQUIPMENT.HEALTH_CRITICAL_PERCENT) {
        const { alert } = await this.upsertAlert({
          stationId,
          stationCode,
          equipmentId: eh.equipmentId,
          severity: AlertSeverity.CRITICAL,
          title: `Asset Composite Health Critical`,
          message: `Diagnostic health score degraded to ${eh.healthPercent.toFixed(1)}% (Threshold: <50%)`,
          sourceType: "EQUIPMENT",
          sourceId: eh.equipmentId,
          ruleCode: ALERT_RULE_CODES.EQUIPMENT_HEALTH_CRITICAL,
          triggerValue: eh.healthPercent,
          thresholdValue: ALERT_THRESHOLDS.EQUIPMENT.HEALTH_CRITICAL_PERCENT,
          unit: "%"
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private inFlightLocks = new Map<string, Promise<{ alert: Alert; isNew: boolean; isUpdated: boolean }>>();

  /**
   * Deterministic Deduplication and Upsert Engine with Concurrency Lock
   */
  public async upsertAlert(candidate: AlertCandidate): Promise<{ alert: Alert; isNew: boolean; isUpdated: boolean }> {
    const lockKey = `${candidate.stationId}:${candidate.ruleCode}:${candidate.sourceId || "ALL"}`;
    const previousLock = this.inFlightLocks.get(lockKey) || Promise.resolve({} as { alert: Alert; isNew: boolean; isUpdated: boolean });

    const executeUpsert = async (): Promise<{ alert: Alert; isNew: boolean; isUpdated: boolean }> => {
      // Check for existing active alert matching (stationId, ruleCode, sourceId)
      const existing = await alertRepository.findActiveAlert(
        candidate.stationId,
        candidate.ruleCode,
        candidate.sourceId
      );

      if (existing) {
        // Deduplicate: increment occurrence count and update timestamp
        const shouldElevateSeverity = isHigherSeverity(candidate.severity, existing.severity);

        const updated = await alertRepository.update(existing.id, {
          occurrenceCount: { increment: 1 },
          lastDetectedAt: new Date(),
          triggerValue: candidate.triggerValue ?? existing.triggerValue,
          severity: shouldElevateSeverity ? candidate.severity : existing.severity,
          message: candidate.message,
          description: candidate.message
        });

        // Broadcast alert:updated event over WebSocket
        realtimeService.publishAlertEvent(REALTIME_EVENT_TYPES.ALERT_UPDATED, {
          id: updated.id,
          stationId: updated.stationId,
          stationCode: candidate.stationCode,
          severity: updated.severity,
          status: updated.status,
          title: updated.title,
          message: updated.message || updated.description,
          ruleCode: updated.ruleCode || undefined,
          sourceType: updated.sourceType || undefined,
          sourceId: updated.sourceId || undefined,
          triggerValue: updated.triggerValue ?? undefined,
          thresholdValue: updated.thresholdValue ?? undefined,
          unit: updated.unit ?? undefined,
          occurrenceCount: updated.occurrenceCount,
          timestamp: updated.lastDetectedAt.toISOString()
        });

        return { alert: updated, isNew: false, isUpdated: true };
      }

      // Safe equipment relation connection
      let equipmentConnect: { id: string } | undefined = undefined;
      if (candidate.equipmentId) {
        const equipExists = await prisma.equipment.findFirst({
          where: {
            OR: [
              { id: candidate.equipmentId },
              { code: candidate.equipmentId }
            ]
          }
        });
        if (equipExists) {
          equipmentConnect = { id: equipExists.id };
        }
      }

      // Fresh Alert: Create in PostgreSQL
      const created = await alertRepository.create({
        station: { connect: { id: candidate.stationId } },
        ...(equipmentConnect && { equipment: { connect: equipmentConnect } }),
        severity: candidate.severity,
        status: AlertStatus.OPEN,
        title: candidate.title,
        description: candidate.message,
        message: candidate.message,
        source: candidate.sourceType,
        sourceType: candidate.sourceType,
        sourceId: candidate.sourceId,
        ruleCode: candidate.ruleCode,
        triggerValue: candidate.triggerValue,
        thresholdValue: candidate.thresholdValue,
        unit: candidate.unit,
        firstDetectedAt: new Date(),
        lastDetectedAt: new Date(),
        occurrenceCount: 1,
        metadata: candidate.metadata
      });

      // Record OperationalEvent audit log
      await prisma.operationalEvent.create({
        data: {
          stationId: candidate.stationId,
          type: "ALERT",
          title: `ALERT_CREATED: ${candidate.title}`,
          description: candidate.message,
          occurredAt: new Date(),
          metadata: JSON.stringify({
            alertId: created.id,
            ruleCode: candidate.ruleCode,
            severity: candidate.severity,
            sourceType: candidate.sourceType
          })
        }
      });

      // Broadcast alert:created event over WebSocket
      realtimeService.publishAlertEvent(REALTIME_EVENT_TYPES.ALERT_CREATED, {
        id: created.id,
        stationId: created.stationId,
        stationCode: candidate.stationCode,
        severity: created.severity,
        status: created.status,
        title: created.title,
        message: created.message || created.description,
        ruleCode: created.ruleCode || undefined,
        sourceType: created.sourceType || undefined,
        sourceId: created.sourceId || undefined,
        triggerValue: created.triggerValue ?? undefined,
        thresholdValue: created.thresholdValue ?? undefined,
        unit: created.unit ?? undefined,
        occurrenceCount: created.occurrenceCount,
        timestamp: created.occurredAt.toISOString()
      });

      return { alert: created, isNew: true, isUpdated: false };
    };

    const currentLock = previousLock.catch(() => {}).then(executeUpsert);
    this.inFlightLocks.set(lockKey, currentLock);

    try {
      return await currentLock;
    } finally {
      if (this.inFlightLocks.get(lockKey) === currentLock) {
        this.inFlightLocks.delete(lockKey);
      }
    }
  }

  /**
   * Deterministic Auto-Resolution Engine with Hysteresis
   */
  public async autoResolveAlert(
    stationId: string,
    stationCode: StationCode,
    ruleCode: string,
    recoveryMessage: string,
    sourceId?: string | null
  ): Promise<Alert | null> {
    const active = await alertRepository.findActiveAlert(stationId, ruleCode, sourceId);
    if (!active || active.status === AlertStatus.RESOLVED || active.status === AlertStatus.SUPPRESSED) {
      return null;
    }

    const resolved = await alertRepository.update(active.id, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
      resolvedBy: "SYSTEM_AUTO_RECOVERY",
      message: `${active.message || active.description} [RECOVERED: ${recoveryMessage}]`
    });

    // Audit log
    await prisma.operationalEvent.create({
      data: {
        stationId,
        type: "ALERT",
        title: `ALERT_RESOLVED: ${resolved.title}`,
        description: `Alert cleared automatically: ${recoveryMessage}`,
        occurredAt: new Date(),
        metadata: JSON.stringify({
          alertId: resolved.id,
          ruleCode,
          resolvedBy: "SYSTEM_AUTO_RECOVERY"
        })
      }
    });

    // Broadcast alert:resolved event over WebSocket
    realtimeService.publishAlertEvent(REALTIME_EVENT_TYPES.ALERT_RESOLVED, {
      id: resolved.id,
      stationId: resolved.stationId,
      stationCode,
      severity: resolved.severity,
      status: AlertStatus.RESOLVED,
      title: resolved.title,
      message: resolved.message || resolved.description,
      ruleCode: resolved.ruleCode || undefined,
      sourceType: resolved.sourceType || undefined,
      sourceId: resolved.sourceId || undefined,
      occurrenceCount: resolved.occurrenceCount,
      resolvedBy: "SYSTEM_AUTO_RECOVERY",
      resolvedAt: resolved.resolvedAt?.toISOString(),
      timestamp: new Date().toISOString()
    });

    return resolved;
  }
}

export const alertEvaluationService = new AlertEvaluationService();
