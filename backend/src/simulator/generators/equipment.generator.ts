import { EquipmentStatus } from "@prisma/client";
import { IRandomProvider } from "./random.provider";
import { NoiseConfig, SimulatedEquipmentState } from "../models/simulator.types";
import { ScenarioModifiers } from "../scenarios/scenario.engine";
import { SIMULATOR_LIMITS } from "../config/simulator.config";

export interface EquipmentBaselineSpec {
  id: string;
  code: string;
  name: string;
  category: string;
  baselineTempC: number;
  baselineVibrationRms: number;
  baselineHealthPercent: number;
  initialRuntimeHours: number;
}

export class EquipmentGenerator {
  /**
   * Generates the next diagnostic health state for a piece of station machinery
   */
  static generateNext(
    prevState: SimulatedEquipmentState | null,
    spec: EquipmentBaselineSpec,
    noise: NoiseConfig,
    modifiers: ScenarioModifiers,
    rng: IRandomProvider,
    intervalMs: number
  ): SimulatedEquipmentState {
    const limits = SIMULATOR_LIMITS.EQUIPMENT;
    const hoursElapsed = intervalMs / 3600000.0;

    const current = prevState || {
      id: spec.id,
      code: spec.code,
      name: spec.name,
      category: spec.category,
      temperature: spec.baselineTempC,
      vibration: spec.baselineVibrationRms,
      loadPercent: 70.0,
      healthPercent: spec.baselineHealthPercent,
      runtimeHours: spec.initialRuntimeHours,
      status: EquipmentStatus.OPERATIONAL,
      notes: "System operating within nominal baseline parameters."
    };

    // Category-specific behavior & scenario impact
    let targetTemp = spec.baselineTempC;
    let targetVibration = spec.baselineVibrationRms;
    let targetHealth = spec.baselineHealthPercent;
    let targetLoad = current.loadPercent;
    let notes = "System operating within nominal baseline parameters.";

    if (spec.category === "GENERATOR") {
      targetTemp += modifiers.generatorTempOffsetC;
      targetVibration += modifiers.generatorVibrationOffset;
      targetHealth += modifiers.generatorHealthOffset;
      targetLoad = Math.min(100, 75.0 + modifiers.generatorTempOffsetC * 0.4);

      if (modifiers.generatorTempOffsetC > 20) {
        notes = "CRITICAL: Engine cylinder head & coolant temperature exceeding safety limits. Immediate de-rating recommended.";
      } else if (modifiers.generatorTempOffsetC > 10) {
        notes = "WARNING: Elevated thermal signature on cylinder exhaust manifold.";
      } else {
        notes = "Stable combustion pressure and exhaust temperature across cylinders.";
      }
    } else if (spec.category === "COMMUNICATION") {
      targetHealth += modifiers.communicationHealthOffset;
      if (modifiers.communicationHealthOffset < -20) {
        notes = "WARNING: Satellite RF tracking servo azimuth error elevated. Low signal-to-noise ratio.";
      } else {
        notes = "GSAT link locked. Tracking servo alignment within ±0.02° tolerance.";
      }
    } else if (spec.category === "WATER_SYSTEM") {
      targetHealth += modifiers.generalEquipmentHealthOffset;
      targetVibration += modifiers.generalVibrationOffset;
      if (targetHealth < 80) {
        notes = "Pre-filter differential pressure elevated. Membrane backwash advised.";
      } else {
        notes = "Permeate flow rate stable at 1.8 m³/h.";
      }
    } else if (spec.category === "BATTERY") {
      targetHealth += modifiers.generalEquipmentHealthOffset * 0.5;
      targetVibration = 0.1;
      notes = "LiFePO4 battery string cell voltage balance within ±0.015V.";
    } else if (spec.category === "HVAC") {
      targetHealth += modifiers.generalEquipmentHealthOffset;
      targetVibration += modifiers.generalVibrationOffset;
      targetTemp += modifiers.generalEquipmentHealthOffset < -10 ? 4.0 : 0;
      notes = "Air handling supply airflow and heat recovery wheel functioning normally.";
    } else {
      targetHealth += modifiers.generalEquipmentHealthOffset;
      targetVibration += modifiers.generalVibrationOffset;
    }

    // Apply drift & noise
    const tempNoise = rng.nextGaussian(0, noise.equipmentTempNoise);
    const vibrationNoise = Math.abs(rng.nextGaussian(0, noise.vibrationNoise));

    // Temperature update with thermal inertia (heats up rapidly during active overheat)
    const tempRate = modifiers.generatorTempOffsetC > 0 && spec.category === "GENERATOR" ? 0.45 : 0.1;
    const nextTemp = Math.min(
      Math.max(current.temperature + (targetTemp - current.temperature) * tempRate + tempNoise, limits.MIN_TEMP_C),
      limits.MAX_TEMP_C
    );

    // Vibration update (rapid mechanical onset during overheat)
    const vibRate = modifiers.generatorVibrationOffset > 0 && spec.category === "GENERATOR" ? 0.45 : 0.1;
    const nextVibration = Math.min(
      Math.max(current.vibration + (targetVibration - current.vibration) * vibRate + vibrationNoise, limits.MIN_VIBRATION_RMS),
      limits.MAX_VIBRATION_RMS
    );

    // Health percent update (slow gradual movement: 3% reversion to target)
    const healthNoise = rng.nextGaussian(0, 0.05);
    const nextHealth = Math.min(
      Math.max(current.healthPercent + (targetHealth - current.healthPercent) * 0.03 + healthNoise, limits.MIN_HEALTH_PERCENT),
      limits.MAX_HEALTH_PERCENT
    );

    // Runtime hours increment
    const nextRuntimeHours = current.runtimeHours + hoursElapsed;

    // Determine equipment operational status
    let status: EquipmentStatus = EquipmentStatus.OPERATIONAL;
    if (nextHealth < 50 || nextTemp > 105 || nextVibration > 6.0) {
      status = EquipmentStatus.CRITICAL;
    } else if (nextHealth < 75 || nextTemp > 96 || nextVibration > 3.8) {
      status = EquipmentStatus.WARNING;
    } else if (nextHealth < 88 || nextVibration > 2.8) {
      status = EquipmentStatus.DEGRADED;
    }

    return {
      id: spec.id,
      code: spec.code,
      name: spec.name,
      category: spec.category,
      temperature: Number(nextTemp.toFixed(1)),
      vibration: Number(nextVibration.toFixed(2)),
      loadPercent: Number(targetLoad.toFixed(1)),
      healthPercent: Number(nextHealth.toFixed(1)),
      runtimeHours: Number(nextRuntimeHours.toFixed(1)),
      status,
      notes
    };
  }
}
