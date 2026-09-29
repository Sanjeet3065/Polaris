/**
 * POLARIS — Operational Telemetry Thresholds & Status Evaluators
 * Phase 7: Energy + Environment Monitoring
 * 
 * Centralized, deterministic threshold evaluation aligned with:
 * - Phase 4 IoT Simulator scenarios (BATTERY_LOW, LOW_FUEL, POWER_SHORTAGE, GENERATOR_OVERHEAT, HIGH_WIND)
 * - NCPOR Antarctic Research Station operating safety guidelines (Maitri & Bharati)
 */

export type OperationalStatus = "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE" | "UNKNOWN";

export interface StatusEvaluation {
  status: OperationalStatus;
  label: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  description: string;
}

/**
 * Standard Status Design Tokens
 */
export const STATUS_THEMES: Record<OperationalStatus, Omit<StatusEvaluation, "description">> = {
  NORMAL: {
    status: "NORMAL",
    label: "Optimal",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-500/10"
  },
  WARNING: {
    status: "WARNING",
    label: "Advisory",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-500/10"
  },
  CRITICAL: {
    status: "CRITICAL",
    label: "Hazard",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-500/10"
  },
  OFFLINE: {
    status: "OFFLINE",
    label: "Offline",
    badgeClass: "bg-slate-700/20 text-slate-400 border-slate-700/40",
    textClass: "text-slate-400",
    borderClass: "border-slate-700/40",
    bgClass: "bg-slate-700/20"
  },
  UNKNOWN: {
    status: "UNKNOWN",
    label: "Telemetry Pending",
    badgeClass: "bg-slate-800/40 text-slate-500 border-slate-700/30",
    textClass: "text-slate-500",
    borderClass: "border-slate-700/30",
    bgClass: "bg-slate-800/40"
  }
};

// ==========================================
// ENERGY THRESHOLDS & EVALUATORS
// ==========================================

export const ENERGY_THRESHOLDS = {
  battery: {
    criticalSocPercent: 20, // Depletion boundary (matches BATTERY_LOW)
    warningSocPercent: 35,
    criticalMinVoltage: 460, // Volts
    warningMinVoltage: 480
  },
  fuel: {
    criticalPercent: 20, // Reserve boundary (matches LOW_FUEL)
    warningPercent: 40,
    criticalDaysRemaining: 14,
    warningDaysRemaining: 30
  },
  powerBalance: {
    criticalDeficitKw: -50, // Severe generation deficit (matches POWER_SHORTAGE)
    warningDeficitKw: -15   // Moderate discharge load
  },
  generator: {
    criticalTempC: 98,    // Overheat threshold (matches GENERATOR_OVERHEAT)
    warningTempC: 88,
    criticalVibration: 4.5, // mm/s
    warningVibration: 3.2
  }
} as const;

/**
 * Evaluates Battery Bank state
 */
export function evaluateBatteryStatus(
  socPercent: number,
  voltage?: number,
  isOffline = false
): StatusEvaluation {
  if (isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Battery management subsystem offline" };
  }
  if (isNaN(socPercent) || socPercent === null || socPercent === undefined) {
    return { ...STATUS_THEMES.UNKNOWN, description: "Battery SoC telemetry unavailable" };
  }

  if (socPercent <= ENERGY_THRESHOLDS.battery.criticalSocPercent || (voltage && voltage < ENERGY_THRESHOLDS.battery.criticalMinVoltage)) {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Critical Depletion",
      description: `Battery state of charge at ${Math.round(socPercent)}% — reserve capacity compromised`
    };
  }
  if (socPercent <= ENERGY_THRESHOLDS.battery.warningSocPercent || (voltage && voltage < ENERGY_THRESHOLDS.battery.warningMinVoltage)) {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Low Charge",
      description: `Battery charge degraded at ${Math.round(socPercent)}% — solar or generator boost advised`
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Optimal Charge",
    description: `Battery bank nominal at ${Math.round(socPercent)}% SoC`
  };
}

/**
 * Evaluates Station Bulk Fuel Reserves
 */
export function evaluateFuelStatus(
  fuelPercent: number,
  daysRemaining?: number,
  isOffline = false
): StatusEvaluation {
  if (isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Fuel farm monitoring offline" };
  }
  if (isNaN(fuelPercent) || fuelPercent === null || fuelPercent === undefined) {
    return { ...STATUS_THEMES.UNKNOWN, description: "Fuel reserve telemetry unavailable" };
  }

  if (
    fuelPercent <= ENERGY_THRESHOLDS.fuel.criticalPercent ||
    (daysRemaining !== undefined && daysRemaining <= ENERGY_THRESHOLDS.fuel.criticalDaysRemaining)
  ) {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Critical Depletion",
      description: `Fuel reserve at ${Math.round(fuelPercent)}% (${daysRemaining ?? "?"} days remaining) — urgent refueling required`
    };
  }
  if (
    fuelPercent <= ENERGY_THRESHOLDS.fuel.warningPercent ||
    (daysRemaining !== undefined && daysRemaining <= ENERGY_THRESHOLDS.fuel.warningDaysRemaining)
  ) {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Low Reserves",
      description: `Fuel storage down to ${Math.round(fuelPercent)}% — operational autonomy reduced`
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Reserves Nominal",
    description: `Bulk fuel tank levels secure at ${Math.round(fuelPercent)}%`
  };
}

/**
 * Evaluates Instantaneous Power Balance (Generation - Consumption)
 */
export function evaluatePowerBalanceStatus(
  netPowerKw: number,
  isOffline = false
): StatusEvaluation {
  if (isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Grid telemetry offline" };
  }
  if (isNaN(netPowerKw) || netPowerKw === null || netPowerKw === undefined) {
    return { ...STATUS_THEMES.UNKNOWN, description: "Power balance telemetry unavailable" };
  }

  if (netPowerKw <= ENERGY_THRESHOLDS.powerBalance.criticalDeficitKw) {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Severe Deficit",
      description: `Microgrid deficit of ${Math.abs(Math.round(netPowerKw))} kW — shedding non-essential load`
    };
  }
  if (netPowerKw <= ENERGY_THRESHOLDS.powerBalance.warningDeficitKw) {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Minor Deficit",
      description: `Load demand exceeds generation by ${Math.abs(Math.round(netPowerKw))} kW — drawing from battery bank`
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: netPowerKw > 2 ? "Surplus Generation" : "Balanced Grid",
    description: netPowerKw > 2
      ? `Net generation surplus of +${Math.round(netPowerKw)} kW replenishing batteries`
      : "Generation in equilibrium with station load"
  };
}

/**
 * Evaluates overall station energy system health
 */
export function evaluateOverallEnergyStatus(params: {
  batterySoc: number;
  fuelPercent: number;
  netPowerKw: number;
  fuelDays?: number;
  isOffline?: boolean;
}): StatusEvaluation {
  if (params.isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Energy monitoring system offline" };
  }

  const bStatus = evaluateBatteryStatus(params.batterySoc, undefined, params.isOffline);
  const fStatus = evaluateFuelStatus(params.fuelPercent, params.fuelDays, params.isOffline);
  const pStatus = evaluatePowerBalanceStatus(params.netPowerKw, params.isOffline);

  if (bStatus.status === "CRITICAL" || fStatus.status === "CRITICAL" || pStatus.status === "CRITICAL") {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Energy Alert",
      description: "Critical constraints detected in microgrid power or fuel storage"
    };
  }

  if (bStatus.status === "WARNING" || fStatus.status === "WARNING" || pStatus.status === "WARNING") {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Energy Advisory",
      description: "Subsystem warnings active — monitor generation and battery recharge"
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Microgrid Stable",
    description: "All microgrid circuits, generation arrays, and storage operating within nominal margins"
  };
}

// ==========================================
// ENVIRONMENT THRESHOLDS & EVALUATORS
// ==========================================

export const ENVIRONMENT_THRESHOLDS = {
  temperature: {
    criticalMinC: -55, // Extreme Polar Hazard
    warningMinC: -40   // Severe sub-zero chill
  },
  windSpeed: {
    criticalKmh: 80, // Blizzard force / Katabatic storm (matches HIGH_WIND)
    warningKmh: 50   // Gale warning
  },
  pressure: {
    criticalMinHpa: 955, // Extreme cyclonic plunge
    warningMinHpa: 970   // Frontal depression / incoming storm
  },
  visibility: {
    criticalMinKm: 1.0, // Whiteout conditions
    warningMinKm: 5.0   // Restricted polar visibility
  }
} as const;

/**
 * Evaluates Ambient Temperature
 */
export function evaluateTemperatureStatus(tempC: number, isOffline = false): StatusEvaluation {
  if (isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Temperature sensor offline" };
  }
  if (isNaN(tempC) || tempC === null || tempC === undefined) {
    return { ...STATUS_THEMES.UNKNOWN, description: "Temperature telemetry unavailable" };
  }

  if (tempC <= ENVIRONMENT_THRESHOLDS.temperature.criticalMinC) {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Extreme Hazard",
      description: `Ambient temperature ${tempC.toFixed(1)}°C below extreme survivability limit`
    };
  }
  if (tempC <= ENVIRONMENT_THRESHOLDS.temperature.warningMinC) {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Severe Chill",
      description: `Ambient temperature ${tempC.toFixed(1)}°C — mandatory cold-weather protocol`
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Nominal Polar",
    description: `Sub-zero conditions within expected seasonal envelope (${tempC.toFixed(1)}°C)`
  };
}

/**
 * Evaluates Wind Speed & Katabatic Gale Status
 */
export function evaluateWindStatus(speedKmh: number, isOffline = false): StatusEvaluation {
  if (isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Anemometer offline" };
  }
  if (isNaN(speedKmh) || speedKmh === null || speedKmh === undefined) {
    return { ...STATUS_THEMES.UNKNOWN, description: "Wind telemetry unavailable" };
  }

  if (speedKmh >= ENVIRONMENT_THRESHOLDS.windSpeed.criticalKmh) {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Katabatic Blizzard",
      description: `Severe gale of ${Math.round(speedKmh)} km/h — zero outdoor travel authorized`
    };
  }
  if (speedKmh >= ENVIRONMENT_THRESHOLDS.windSpeed.warningKmh) {
    return {
      ...STATUS_THEMES.WARNING,
      label: "High Gale Warning",
      description: `High polar wind of ${Math.round(speedKmh)} km/h — secure loose station infrastructure`
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Breeze / Moderate",
    description: `Wind speed steady at ${Math.round(speedKmh)} km/h`
  };
}

/**
 * Evaluates Barometric Pressure & Storm Threat
 */
export function evaluatePressureStatus(pressureHpa: number, isOffline = false): StatusEvaluation {
  if (isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Barometer offline" };
  }
  if (isNaN(pressureHpa) || pressureHpa === null || pressureHpa === undefined) {
    return { ...STATUS_THEMES.UNKNOWN, description: "Pressure telemetry unavailable" };
  }

  if (pressureHpa <= ENVIRONMENT_THRESHOLDS.pressure.criticalMinHpa) {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Rapid Cyclonic Plunge",
      description: `Barometer plunge to ${Math.round(pressureHpa)} hPa indicates incoming violent blizzard`
    };
  }
  if (pressureHpa <= ENVIRONMENT_THRESHOLDS.pressure.warningMinHpa) {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Storm Front Approaching",
      description: `Low pressure at ${Math.round(pressureHpa)} hPa indicates weather degradation`
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Pressure Stable",
    description: `Barometric pressure steady at ${Math.round(pressureHpa)} hPa`
  };
}

/**
 * Evaluates Optical Visibility
 */
export function evaluateVisibilityStatus(visibilityKm: number, isOffline = false): StatusEvaluation {
  if (isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Visibility sensor offline" };
  }
  if (isNaN(visibilityKm) || visibilityKm === null || visibilityKm === undefined) {
    return { ...STATUS_THEMES.UNKNOWN, description: "Visibility telemetry unavailable" };
  }

  if (visibilityKm <= ENVIRONMENT_THRESHOLDS.visibility.criticalMinKm) {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Whiteout",
      description: `Optical visibility collapsed to ${visibilityKm.toFixed(1)} km — spatial disorientation risk`
    };
  }
  if (visibilityKm <= ENVIRONMENT_THRESHOLDS.visibility.warningMinKm) {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Restricted",
      description: `Visibility constrained to ${visibilityKm.toFixed(1)} km due to blowing drift`
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Clear Polar Air",
    description: `Optimal visibility of ${visibilityKm.toFixed(1)} km across terrain`
  };
}

/**
 * Evaluates overall environmental safety state
 */
export function evaluateOverallEnvironmentStatus(params: {
  temperatureC: number;
  windSpeedKmh: number;
  pressureHpa: number;
  visibilityKm?: number;
  isOffline?: boolean;
}): StatusEvaluation {
  if (params.isOffline) {
    return { ...STATUS_THEMES.OFFLINE, description: "Environmental monitoring system offline" };
  }

  const tStatus = evaluateTemperatureStatus(params.temperatureC, params.isOffline);
  const wStatus = evaluateWindStatus(params.windSpeedKmh, params.isOffline);
  const pStatus = evaluatePressureStatus(params.pressureHpa, params.isOffline);
  const vStatus = params.visibilityKm !== undefined
    ? evaluateVisibilityStatus(params.visibilityKm, params.isOffline)
    : { status: "NORMAL" };

  if (tStatus.status === "CRITICAL" || wStatus.status === "CRITICAL" || pStatus.status === "CRITICAL" || vStatus.status === "CRITICAL") {
    return {
      ...STATUS_THEMES.CRITICAL,
      label: "Severe Polar Hazard",
      description: "Severe meteorological conditions active — lockdown station outer doors"
    };
  }

  if (tStatus.status === "WARNING" || wStatus.status === "WARNING" || pStatus.status === "WARNING" || vStatus.status === "WARNING") {
    return {
      ...STATUS_THEMES.WARNING,
      label: "Advisory Active",
      description: "Heightened weather activity — review outdoor scientific operations"
    };
  }

  return {
    ...STATUS_THEMES.NORMAL,
    label: "Atmosphere Nominal",
    description: "Antarctic weather conditions within safe parameters for seasonal operations"
  };
}
