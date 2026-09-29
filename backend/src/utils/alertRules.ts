import { AlertSeverity, AlertStatus, IncidentStatus, IncidentSeverity, IncidentCategory, IncidentImpact } from "@prisma/client";

/**
 * Standard Alert Rule Codes for POLARIS
 * Deterministic identifiers for threshold rules and deduplication
 */
export const ALERT_RULE_CODES = {
  // Energy Subsystem Rules
  ENERGY_BATTERY_CRITICAL: "ENERGY_BATTERY_CRITICAL",
  ENERGY_BATTERY_LOW: "ENERGY_BATTERY_LOW",
  ENERGY_BATTERY_VOLTAGE_CRITICAL: "ENERGY_BATTERY_VOLTAGE_CRITICAL",
  ENERGY_BATTERY_VOLTAGE_LOW: "ENERGY_BATTERY_VOLTAGE_LOW",
  ENERGY_FUEL_CRITICAL: "ENERGY_FUEL_CRITICAL",
  ENERGY_FUEL_LOW: "ENERGY_FUEL_LOW",
  ENERGY_POWER_SHORTAGE_CRITICAL: "ENERGY_POWER_SHORTAGE_CRITICAL",
  ENERGY_POWER_DEFICIT: "ENERGY_POWER_DEFICIT",

  // Environment Subsystem Rules
  ENV_WIND_BLIZZARD_GALE: "ENV_WIND_BLIZZARD_GALE",
  ENV_WIND_HIGH: "ENV_WIND_HIGH",
  ENV_WIND_WARNING: "ENV_WIND_WARNING",
  ENV_TEMP_EXTREME_COLD: "ENV_TEMP_EXTREME_COLD",
  ENV_TEMP_LOW_WARNING: "ENV_TEMP_LOW_WARNING",
  ENV_VISIBILITY_WHITEOUT: "ENV_VISIBILITY_WHITEOUT",
  ENV_VISIBILITY_LOW: "ENV_VISIBILITY_LOW",
  ENV_PRESSURE_STORM_DROP: "ENV_PRESSURE_STORM_DROP",

  // Equipment Subsystem Rules
  EQUIPMENT_OVERHEAT_CRITICAL: "EQUIPMENT_OVERHEAT_CRITICAL",
  EQUIPMENT_OVERHEAT_WARNING: "EQUIPMENT_OVERHEAT_WARNING",
  EQUIPMENT_VIBRATION_CRITICAL: "EQUIPMENT_VIBRATION_CRITICAL",
  EQUIPMENT_VIBRATION_WARNING: "EQUIPMENT_VIBRATION_WARNING",
  EQUIPMENT_HEALTH_CRITICAL: "EQUIPMENT_HEALTH_CRITICAL",
  EQUIPMENT_HEALTH_DEGRADED: "EQUIPMENT_HEALTH_DEGRADED",
  COMMUNICATION_DEGRADED: "COMMUNICATION_DEGRADED",

  // Inventory Subsystem Rules
  INVENTORY_OUT_OF_STOCK: "INVENTORY_OUT_OF_STOCK",
  INVENTORY_CRITICAL_STOCK: "INVENTORY_CRITICAL_STOCK",

  // Logistics Subsystem Rules
  LOGISTICS_SHIPMENT_CRITICAL_DELAY: "LOGISTICS_SHIPMENT_CRITICAL_DELAY",

  // Manual / Operational Rules
  OPERATOR_MANUAL_ALERT: "OPERATOR_MANUAL_ALERT"
} as const;

export type AlertRuleCode = (typeof ALERT_RULE_CODES)[keyof typeof ALERT_RULE_CODES];

/**
 * Deterministic Alert Thresholds and Recovery Values (Hysteresis)
 * Synchronized with Phase 7 energy & environment monitoring specs
 */
export const ALERT_THRESHOLDS = {
  ENERGY: {
    BATTERY_CRITICAL_SOC: 20.0, // <= 20%
    BATTERY_CRITICAL_RECOVERY: 25.0, // >= 25%
    BATTERY_LOW_SOC: 35.0, // <= 35%
    BATTERY_LOW_RECOVERY: 38.0, // > 38%
    BATTERY_VOLTAGE_CRITICAL: 460.0, // < 460 V
    BATTERY_VOLTAGE_RECOVERY: 465.0, // >= 465 V
    BATTERY_VOLTAGE_LOW: 470.0, // < 470 V
    BATTERY_VOLTAGE_LOW_RECOVERY: 472.0, // >= 472 V
    FUEL_CRITICAL_PERCENT: 20.0, // <= 20%
    FUEL_CRITICAL_DAYS: 14.0, // <= 14 days
    FUEL_CRITICAL_RECOVERY_PERCENT: 25.0,
    FUEL_LOW_PERCENT: 40.0, // <= 40%
    FUEL_LOW_RECOVERY_PERCENT: 45.0,
    POWER_DEFICIT_CRITICAL_KW: -50.0, // < -50 kW
    POWER_DEFICIT_HIGH_KW: -15.0, // < -15 kW
    POWER_DEFICIT_RECOVERY_KW: 0.0 // >= 0 kW
  },
  ENVIRONMENT: {
    WIND_BLIZZARD_GALE_KMH: 120.0, // > 120 km/h
    WIND_BLIZZARD_RECOVERY: 100.0,
    WIND_HIGH_KMH: 80.0, // > 80 km/h
    WIND_HIGH_RECOVERY: 75.0,
    WIND_WARNING_KMH: 50.0, // > 50 km/h
    WIND_WARNING_RECOVERY: 45.0,
    TEMP_EXTREME_COLD_C: -55.0, // <= -55 °C
    TEMP_EXTREME_COLD_RECOVERY: -50.0,
    TEMP_LOW_WARNING_C: -40.0, // <= -40 °C
    TEMP_LOW_RECOVERY: -35.0,
    VISIBILITY_WHITEOUT_KM: 1.0, // < 1.0 km
    VISIBILITY_WHITEOUT_RECOVERY: 2.0,
    VISIBILITY_LOW_KM: 5.0, // < 5.0 km
    VISIBILITY_LOW_RECOVERY: 5.5,
    PRESSURE_STORM_DROP_HPA: 955.0, // < 955 hPa
    PRESSURE_STORM_RECOVERY: 960.0
  },
  EQUIPMENT: {
    TEMPERATURE_CRITICAL_C: 95.0,
    TEMPERATURE_CRITICAL_RECOVERY: 85.0,
    TEMPERATURE_WARNING_C: 85.0,
    TEMPERATURE_WARNING_RECOVERY: 78.0,
    VIBRATION_CRITICAL_MMS: 7.0,
    VIBRATION_CRITICAL_RECOVERY: 5.5,
    VIBRATION_WARNING_MMS: 4.5,
    VIBRATION_WARNING_RECOVERY: 3.8,
    HEALTH_CRITICAL_PERCENT: 50.0,
    HEALTH_CRITICAL_RECOVERY: 60.0,
    HEALTH_DEGRADED_PERCENT: 80.0,
    HEALTH_DEGRADED_RECOVERY: 82.0
  }
} as const;

/**
 * Numeric rank for severity comparisons (higher = more severe)
 */
export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  INFO: 10,
  LOW: 20,
  MEDIUM: 30,
  WARNING: 35, // mapped between MEDIUM and HIGH for backward compatibility
  HIGH: 40,
  CRITICAL: 50
};

/**
 * Compares two severities. Returns true if candidate is strictly higher severity.
 */
export function isHigherSeverity(candidate: AlertSeverity, current: AlertSeverity): boolean {
  return (SEVERITY_RANK[candidate] || 0) > (SEVERITY_RANK[current] || 0);
}

/**
 * Valid Alert Lifecycle Transitions
 */
export const VALID_ALERT_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  OPEN: [AlertStatus.ACKNOWLEDGED, AlertStatus.ESCALATED, AlertStatus.RESOLVED, AlertStatus.SUPPRESSED, AlertStatus.ACTIVE],
  ACTIVE: [AlertStatus.ACKNOWLEDGED, AlertStatus.ESCALATED, AlertStatus.RESOLVED, AlertStatus.SUPPRESSED, AlertStatus.OPEN],
  ACKNOWLEDGED: [AlertStatus.ESCALATED, AlertStatus.RESOLVED, AlertStatus.SUPPRESSED],
  ESCALATED: [AlertStatus.RESOLVED, AlertStatus.SUPPRESSED],
  RESOLVED: [], // Terminal state
  SUPPRESSED: [AlertStatus.OPEN, AlertStatus.ACTIVE] // Allowed to be un-suppressed if re-activated
};

export function isValidAlertTransition(fromStatus: AlertStatus, toStatus: AlertStatus): boolean {
  if (fromStatus === toStatus) return true;
  return VALID_ALERT_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
}

/**
 * Valid Incident Lifecycle Transitions
 */
export const VALID_INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: [IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED],
  INVESTIGATING: [IncidentStatus.MITIGATING, IncidentStatus.RESOLVED],
  MITIGATING: [IncidentStatus.RESOLVED],
  RESOLVED: [IncidentStatus.CLOSED],
  CLOSED: [] // Terminal state
};

export function isValidIncidentTransition(fromStatus: IncidentStatus, toStatus: IncidentStatus): boolean {
  if (fromStatus === toStatus) return true;
  return VALID_INCIDENT_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
}

/**
 * Severity styling tokens for consistent operational UI & badge rendering
 */
export const SEVERITY_THEME: Record<
  AlertSeverity,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  INFO: {
    label: "Informational",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: "Info"
  },
  LOW: {
    label: "Low",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    icon: "CheckCircle"
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: "AlertTriangle"
  },
  WARNING: {
    label: "Warning",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/40",
    icon: "AlertTriangle"
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/40",
    icon: "AlertCircle"
  },
  CRITICAL: {
    label: "Critical",
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/50",
    icon: "Flame"
  }
};
