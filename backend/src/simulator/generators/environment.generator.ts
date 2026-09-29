import { TelemetryStatus } from "@prisma/client";
import { IRandomProvider } from "./random.provider";
import { NoiseConfig, StationBaseline } from "../models/simulator.types";
import { ScenarioModifiers } from "../scenarios/scenario.engine";
import { SIMULATOR_LIMITS } from "../config/simulator.config";

export interface EnvironmentState {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windDirectionCompass: string;
  visibility: number;
  solarRadiation: number;
  snowfallRate: number;
  status: TelemetryStatus;
}

export class EnvironmentGenerator {
  /**
   * Translates azimuth wind degree to standard 8-point compass cardinal
   */
  static getCompassDirection(degrees: number): string {
    const normalized = ((degrees % 360) + 360) % 360;
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
  }

  /**
   * Generates the next environmental telemetry state incorporating temporal correlation,
   * bounded noise, and active scenario perturbations.
   */
  static generateNext(
    prevState: EnvironmentState | null,
    baseline: StationBaseline,
    noise: NoiseConfig,
    modifiers: ScenarioModifiers,
    rng: IRandomProvider,
    timestamp: Date
  ): EnvironmentState {
    const limits = SIMULATOR_LIMITS.ENVIRONMENT;
    const current = prevState || {
      temperature: baseline.temperature,
      humidity: baseline.humidity,
      pressure: baseline.pressure,
      windSpeed: baseline.windSpeed,
      windDirection: baseline.windDirection,
      windDirectionCompass: baseline.windDirectionCompass,
      visibility: baseline.visibility,
      solarRadiation: baseline.solarRadiation,
      snowfallRate: baseline.snowfallRate,
      status: TelemetryStatus.NORMAL
    };

    // 1. Temperature: mean-reverting random walk towards (baseline + scenario offset)
    const targetTemp = baseline.temperature + modifiers.tempOffsetC;
    const tempReversion = (targetTemp - current.temperature) * 0.05; // 5% reversion per tick
    const tempNoise = rng.nextGaussian(0, noise.tempNoise);
    const nextTemp = Math.min(
      Math.max(current.temperature + tempReversion + tempNoise, limits.MIN_TEMP_C),
      limits.MAX_TEMP_C
    );

    // 2. Humidity: bounded drift around baseline
    const targetHumidity = baseline.humidity + modifiers.humidityOffset;
    const humidityReversion = (targetHumidity - current.humidity) * 0.05;
    const humidityNoise = rng.nextGaussian(0, noise.humidityNoise);
    const nextHumidity = Math.min(
      Math.max(current.humidity + humidityReversion + humidityNoise, limits.MIN_HUMIDITY_PERCENT),
      limits.MAX_HUMIDITY_PERCENT
    );

    // 3. Pressure: slow barometric drift with storm plunge
    const targetPressure = baseline.pressure + modifiers.pressureOffsetHpa;
    const pressureReversion = (targetPressure - current.pressure) * 0.04;
    const pressureNoise = rng.nextGaussian(0, noise.pressureNoise);
    const nextPressure = Math.min(
      Math.max(current.pressure + pressureReversion + pressureNoise, limits.MIN_PRESSURE_HPA),
      limits.MAX_PRESSURE_HPA
    );

    // 4. Wind Speed: dynamic variation with gust spikes (katabatic storms ramp up rapidly)
    const targetWind = baseline.windSpeed + modifiers.windSpeedOffsetKmh;
    const windRate = modifiers.windSpeedOffsetKmh > 0 ? 0.85 : 0.08;
    const windReversion = (targetWind - current.windSpeed) * windRate;
    const windNoise = rng.nextGaussian(0, noise.windNoise);
    const nextWind = Math.min(
      Math.max(current.windSpeed + windReversion + windNoise, limits.MIN_WIND_KMH),
      limits.MAX_WIND_KMH
    );

    // 5. Wind Direction: smooth angular wandering (±2.5 degrees)
    const dirWander = rng.nextGaussian(0, 2.5);
    const nextDir = ((current.windDirection + dirWander) % 360 + 360) % 360;
    const nextCompass = this.getCompassDirection(nextDir);

    // 6. Visibility: inversely correlated with wind speed & blizzard factor
    let baseVisibility = baseline.visibility;
    if (nextWind > 60) {
      // Blowing snow reduces visibility
      baseVisibility = Math.max(1.0, baseline.visibility - (nextWind - 60) * 0.25);
    }
    const nextVisibility = Math.min(
      Math.max(baseVisibility * modifiers.visibilityFactor, limits.MIN_VISIBILITY_KM),
      limits.MAX_VISIBILITY_KM
    );

    // 7. Solar Radiation: diurnal curve modulated by season & weather
    const utcHours = timestamp.getUTCHours() + timestamp.getUTCMinutes() / 60;
    // Approximated Antarctic summer cycle: peak around 12:00 UTC
    const solarAngle = Math.sin(((utcHours - 6) / 12) * Math.PI);
    let calculatedSolar = solarAngle > 0 ? baseline.solarRadiation * (0.4 + 0.6 * solarAngle) : 5.0;
    calculatedSolar = calculatedSolar * modifiers.solarFactor;
    const nextSolar = Math.min(Math.max(calculatedSolar, limits.MIN_SOLAR_WM2), limits.MAX_SOLAR_WM2);

    // 8. Snowfall Rate
    const nextSnowfall = modifiers.windSpeedOffsetKmh > 30 ? Math.min(1.5 + (nextWind - 60) * 0.08, limits.MAX_SNOWFALL_MMH) : 0.0;

    // 9. Alert Status Evaluation
    let status: TelemetryStatus = TelemetryStatus.NORMAL;
    if (nextWind > 95 || nextTemp < -55 || nextPressure < 950) {
      status = TelemetryStatus.CRITICAL;
    } else if (nextWind > 65 || nextTemp < -45 || nextPressure < 965) {
      status = TelemetryStatus.WARNING;
    }

    return {
      temperature: Number(nextTemp.toFixed(1)),
      humidity: Number(nextHumidity.toFixed(1)),
      pressure: Number(nextPressure.toFixed(1)),
      windSpeed: Number(nextWind.toFixed(1)),
      windDirection: Number(nextDir.toFixed(1)),
      windDirectionCompass: nextCompass,
      visibility: Number(nextVisibility.toFixed(1)),
      solarRadiation: Number(nextSolar.toFixed(1)),
      snowfallRate: Number(nextSnowfall.toFixed(1)),
      status
    };
  }
}
