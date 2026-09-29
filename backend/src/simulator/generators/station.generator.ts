import { StationStatus, TelemetryStatus, EquipmentStatus } from "@prisma/client";
import { SimulatedEquipmentState } from "../models/simulator.types";
import { EnergyState } from "./energy.generator";
import { EnvironmentState } from "./environment.generator";

export class StationGenerator {
  /**
   * Computes composite station health index and operational status
   */
  static evaluateStation(
    equipmentStates: SimulatedEquipmentState[],
    energy: EnergyState,
    environment: EnvironmentState
  ): { healthPercent: number; status: StationStatus } {
    // 1. Equipment Health Component (weighted 50%)
    let equipHealthSum = 0;
    let criticalEquipCount = 0;
    let warningEquipCount = 0;

    for (const eq of equipmentStates) {
      equipHealthSum += eq.healthPercent;
      if (eq.status === EquipmentStatus.CRITICAL) criticalEquipCount++;
      else if (eq.status === EquipmentStatus.WARNING) warningEquipCount++;
    }

    const avgEquipHealth = equipmentStates.length > 0 ? equipHealthSum / equipmentStates.length : 95.0;

    // 2. Energy Health Component (weighted 30%)
    // Battery health score
    let energyScore = 100;
    if (energy.batteryPercent < 20) energyScore -= 40;
    else if (energy.batteryPercent < 40) energyScore -= 20;

    if (energy.fuelPercent < 15) energyScore -= 40;
    else if (energy.fuelPercent < 30) energyScore -= 15;

    // 3. Environmental Impact Component (weighted 20%)
    let envScore = 100;
    if (environment.status === TelemetryStatus.CRITICAL) envScore -= 40;
    else if (environment.status === TelemetryStatus.WARNING) envScore -= 15;

    // Composite Health
    const compositeHealth = avgEquipHealth * 0.5 + energyScore * 0.3 + envScore * 0.2;
    const finalHealthPercent = Math.min(Math.max(compositeHealth, 0.0), 100.0);

    // Operational Status
    let status: StationStatus = StationStatus.OPERATIONAL;
    if (criticalEquipCount > 0 || energy.batteryPercent < 15 || finalHealthPercent < 60) {
      status = StationStatus.CRITICAL;
    } else if (warningEquipCount > 0 || energy.batteryPercent < 30 || environment.status === TelemetryStatus.CRITICAL || finalHealthPercent < 80) {
      status = StationStatus.WARNING;
    } else if (finalHealthPercent < 90) {
      status = StationStatus.DEGRADED;
    }

    return {
      healthPercent: Number(finalHealthPercent.toFixed(1)),
      status
    };
  }
}
