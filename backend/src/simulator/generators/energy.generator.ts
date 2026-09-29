import { IRandomProvider } from "./random.provider";
import { NoiseConfig, StationBaseline } from "../models/simulator.types";
import { ScenarioModifiers } from "../scenarios/scenario.engine";
import { SIMULATOR_LIMITS } from "../config/simulator.config";

export interface EnergyState {
  generationKw: number;
  solarKw: number;
  dieselKw: number;
  consumptionKw: number;
  netPowerKw: number;
  batteryPercent: number;
  batteryVoltage: number;
  fuelPercent: number;
  fuelLiters: number;
  fuelDaysRemaining: number;
}

export class EnergyGenerator {
  /**
   * Generates the next energy and microgrid telemetry state incorporating power balance,
   * battery electrochemical charging/discharging curves, and fuel burn rate.
   */
  static generateNext(
    prevState: EnergyState | null,
    baseline: StationBaseline,
    noise: NoiseConfig,
    modifiers: ScenarioModifiers,
    rng: IRandomProvider,
    intervalMs: number
  ): EnergyState {
    const limits = SIMULATOR_LIMITS.ENERGY;
    const current = prevState || {
      generationKw: baseline.powerGenerationKw,
      solarKw: baseline.solarKw,
      dieselKw: baseline.dieselKw,
      consumptionKw: baseline.powerConsumptionKw,
      netPowerKw: baseline.powerGenerationKw - baseline.powerConsumptionKw,
      batteryPercent: baseline.batteryPercent,
      batteryVoltage: baseline.batteryVoltage,
      fuelPercent: baseline.fuelPercent,
      fuelLiters: baseline.fuelLiters,
      fuelDaysRemaining: baseline.fuelDaysRemaining
    };

    const deltaSeconds = intervalMs / 1000.0;
    const hoursElapsed = intervalMs / 3600000.0;

    // 1. Generation: Solar + Diesel modulated by scenario multipliers
    const targetSolar = baseline.solarKw * modifiers.solarFactor;
    const targetDiesel = baseline.dieselKw * modifiers.generationFactor;
    const solarNoise = rng.nextGaussian(0, noise.powerNoise * 0.4);
    const dieselNoise = rng.nextGaussian(0, noise.powerNoise * 0.6);

    const nextSolar = Math.max(0, targetSolar + solarNoise);
    const nextDiesel = Math.max(0, targetDiesel + dieselNoise);
    const nextTotalGen = Math.min(
      Math.max(nextSolar + nextDiesel, limits.MIN_POWER_KW),
      limits.MAX_POWER_KW
    );

    // 2. Consumption: Station load (life support, labs, heating)
    const targetConsumption = baseline.powerConsumptionKw * modifiers.consumptionFactor;
    const consumptionNoise = rng.nextGaussian(0, noise.powerNoise * 0.5);
    const nextConsumption = Math.min(
      Math.max(targetConsumption + consumptionNoise, limits.MIN_POWER_KW),
      limits.MAX_POWER_KW
    );

    // 3. Net Power Balance: Generation - Consumption
    const netPowerKw = nextTotalGen - nextConsumption;

    // 4. Battery State-of-Charge (SoC) Dynamics:
    // Surplus charges battery; deficit discharges battery
    let batteryDelta = 0;
    if (netPowerKw > 0) {
      // Charging: surplus power translates into ~0.0008% SoC per kW-second (500kWh pack)
      batteryDelta = (netPowerKw * 0.0008) * deltaSeconds;
    } else {
      // Discharging: deficit draws from battery
      batteryDelta = (netPowerKw * 0.0009) * deltaSeconds;
    }

    // Apply scenario battery drain (e.g. BATTERY_LOW or POWER_SHORTAGE)
    if (modifiers.batteryDrainRatePerSec > 0) {
      batteryDelta -= modifiers.batteryDrainRatePerSec * deltaSeconds;
    }

    // Slight noise
    batteryDelta += rng.nextGaussian(0, noise.batteryNoise * 0.1);

    const nextBatteryPercent = Math.min(
      Math.max(current.batteryPercent + batteryDelta, limits.MIN_BATTERY_PERCENT),
      limits.MAX_BATTERY_PERCENT
    );

    // 5. Battery Voltage: Correlated with SoC (Nominal 48V DC bus, ~44.0V at 0% to ~52.5V at 100%)
    const nominalVoltage = 44.0 + (nextBatteryPercent / 100.0) * 8.5;
    const nextBatteryVoltage = Math.min(
      Math.max(nominalVoltage + rng.nextGaussian(0, 0.05), limits.MIN_BATTERY_VOLTS),
      limits.MAX_BATTERY_VOLTS
    );

    // 6. Fuel Consumption Dynamics:
    // Typical marine diesel generator consumes ~0.24 liters of fuel per kWh generated
    const fuelBurnRatePerKwh = 0.24; // L/kWh
    const fuelBurnLiters = nextDiesel * fuelBurnRatePerKwh * hoursElapsed;
    const scenarioFuelDrop = modifiers.fuelDrainRatePerSec * deltaSeconds * 10.0; // liters

    const totalFuelLitersBurned = fuelBurnLiters + scenarioFuelDrop + rng.nextGaussian(0, noise.fuelNoise);
    const nextFuelLiters = Math.max(0, current.fuelLiters - Math.max(0, totalFuelLitersBurned));

    // Station fuel capacity derived from baseline (e.g. 81,600L at 68% -> 120,000L full capacity)
    const fullTankLiters = baseline.fuelLiters / (baseline.fuelPercent / 100.0);
    const nextFuelPercent = Math.min(
      Math.max((nextFuelLiters / fullTankLiters) * 100.0, limits.MIN_FUEL_PERCENT),
      limits.MAX_FUEL_PERCENT
    );

    // Days remaining = fuelLiters / (daily burn rate at current load)
    const dailyBurnLiters = nextDiesel * fuelBurnRatePerKwh * 24.0;
    const nextDaysRemaining = dailyBurnLiters > 0
      ? Number((nextFuelLiters / dailyBurnLiters).toFixed(1))
      : 365.0;

    return {
      generationKw: Number(nextTotalGen.toFixed(1)),
      solarKw: Number(nextSolar.toFixed(1)),
      dieselKw: Number(nextDiesel.toFixed(1)),
      consumptionKw: Number(nextConsumption.toFixed(1)),
      netPowerKw: Number(netPowerKw.toFixed(1)),
      batteryPercent: Number(nextBatteryPercent.toFixed(1)),
      batteryVoltage: Number(nextBatteryVoltage.toFixed(1)),
      fuelPercent: Number(nextFuelPercent.toFixed(1)),
      fuelLiters: Number(nextFuelLiters.toFixed(1)),
      fuelDaysRemaining: nextDaysRemaining
    };
  }
}
