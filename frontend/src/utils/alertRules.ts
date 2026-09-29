export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "WARNING" | "CRITICAL";

export type AlertStatus = "OPEN" | "ACTIVE" | "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED" | "SUPPRESSED";

export type IncidentStatus = "OPEN" | "INVESTIGATING" | "MITIGATING" | "RESOLVED" | "CLOSED";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentCategory =
  | "POWER"
  | "ENERGY"
  | "ENVIRONMENT"
  | "EQUIPMENT"
  | "COMMUNICATION"
  | "INVENTORY"
  | "LOGISTICS"
  | "SAFETY"
  | "OPERATIONS"
  | "OTHER";

export type IncidentImpact = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Standard Alert Rule Codes for POLARIS
 */
export const ALERT_RULE_CODES = {
  ENERGY_BATTERY_CRITICAL: "ENERGY_BATTERY_CRITICAL",
  ENERGY_BATTERY_LOW: "ENERGY_BATTERY_LOW",
  ENERGY_BATTERY_VOLTAGE_CRITICAL: "ENERGY_BATTERY_VOLTAGE_CRITICAL",
  ENERGY_BATTERY_VOLTAGE_LOW: "ENERGY_BATTERY_VOLTAGE_LOW",
  ENERGY_FUEL_CRITICAL: "ENERGY_FUEL_CRITICAL",
  ENERGY_FUEL_LOW: "ENERGY_FUEL_LOW",
  ENERGY_POWER_SHORTAGE_CRITICAL: "ENERGY_POWER_SHORTAGE_CRITICAL",
  ENERGY_POWER_DEFICIT: "ENERGY_POWER_DEFICIT",

  ENV_WIND_BLIZZARD_GALE: "ENV_WIND_BLIZZARD_GALE",
  ENV_WIND_HIGH: "ENV_WIND_HIGH",
  ENV_WIND_WARNING: "ENV_WIND_WARNING",
  ENV_TEMP_EXTREME_COLD: "ENV_TEMP_EXTREME_COLD",
  ENV_TEMP_LOW_WARNING: "ENV_TEMP_LOW_WARNING",
  ENV_VISIBILITY_WHITEOUT: "ENV_VISIBILITY_WHITEOUT",
  ENV_VISIBILITY_LOW: "ENV_VISIBILITY_LOW",
  ENV_PRESSURE_STORM_DROP: "ENV_PRESSURE_STORM_DROP",

  EQUIPMENT_OVERHEAT_CRITICAL: "EQUIPMENT_OVERHEAT_CRITICAL",
  EQUIPMENT_OVERHEAT_WARNING: "EQUIPMENT_OVERHEAT_WARNING",
  EQUIPMENT_VIBRATION_CRITICAL: "EQUIPMENT_VIBRATION_CRITICAL",
  EQUIPMENT_VIBRATION_WARNING: "EQUIPMENT_VIBRATION_WARNING",
  EQUIPMENT_HEALTH_CRITICAL: "EQUIPMENT_HEALTH_CRITICAL",
  EQUIPMENT_HEALTH_DEGRADED: "EQUIPMENT_HEALTH_DEGRADED",
  COMMUNICATION_DEGRADED: "COMMUNICATION_DEGRADED",

  INVENTORY_OUT_OF_STOCK: "INVENTORY_OUT_OF_STOCK",
  INVENTORY_CRITICAL_STOCK: "INVENTORY_CRITICAL_STOCK",

  LOGISTICS_SHIPMENT_CRITICAL_DELAY: "LOGISTICS_SHIPMENT_CRITICAL_DELAY",
  OPERATOR_MANUAL_ALERT: "OPERATOR_MANUAL_ALERT"
} as const;

/**
 * Severity styling tokens for Polar Dark UI
 */
export const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; badge: string; border: string; dot: string; text: string }
> = {
  CRITICAL: {
    label: "CRITICAL",
    badge: "bg-rose-500/20 text-rose-400 border border-rose-500/40",
    border: "border-rose-500/50",
    dot: "bg-rose-500",
    text: "text-rose-400"
  },
  HIGH: {
    label: "HIGH",
    badge: "bg-orange-500/20 text-orange-400 border border-orange-500/40",
    border: "border-orange-500/50",
    dot: "bg-orange-500",
    text: "text-orange-400"
  },
  WARNING: {
    label: "WARNING",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
    text: "text-amber-300"
  },
  MEDIUM: {
    label: "MEDIUM",
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
    text: "text-amber-400"
  },
  LOW: {
    label: "LOW",
    badge: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40",
    border: "border-cyan-500/40",
    dot: "bg-cyan-400",
    text: "text-cyan-400"
  },
  INFO: {
    label: "INFO",
    badge: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
    border: "border-blue-500/40",
    dot: "bg-blue-400",
    text: "text-blue-400"
  }
};

/**
 * Status styling tokens for Alerts
 */
export const ALERT_STATUS_CONFIG: Record<
  AlertStatus,
  { label: string; badge: string; dot: string }
> = {
  OPEN: {
    label: "OPEN",
    badge: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    dot: "bg-rose-500 animate-pulse"
  },
  ACTIVE: {
    label: "ACTIVE",
    badge: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    dot: "bg-rose-500 animate-pulse"
  },
  ACKNOWLEDGED: {
    label: "ACKNOWLEDGED",
    badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    dot: "bg-amber-400"
  },
  ESCALATED: {
    label: "ESCALATED",
    badge: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
    dot: "bg-purple-400 animate-pulse"
  },
  RESOLVED: {
    label: "RESOLVED",
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    dot: "bg-emerald-400"
  },
  SUPPRESSED: {
    label: "SUPPRESSED",
    badge: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
    dot: "bg-slate-500"
  }
};

/**
 * Status styling tokens for Incidents
 */
export const INCIDENT_STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; badge: string; dot: string }
> = {
  OPEN: {
    label: "OPEN",
    badge: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
    dot: "bg-rose-500 animate-pulse"
  },
  INVESTIGATING: {
    label: "INVESTIGATING",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    dot: "bg-amber-400 animate-pulse"
  },
  MITIGATING: {
    label: "MITIGATING",
    badge: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
    dot: "bg-cyan-400 animate-pulse"
  },
  RESOLVED: {
    label: "RESOLVED",
    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
    dot: "bg-emerald-400"
  },
  CLOSED: {
    label: "CLOSED",
    badge: "bg-slate-600/20 text-slate-400 border border-slate-600/40",
    dot: "bg-slate-500"
  }
};

/**
 * Valid operational lifecycle transitions for Incidents
 */
export const VALID_INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ["INVESTIGATING", "RESOLVED"],
  INVESTIGATING: ["MITIGATING", "RESOLVED"],
  MITIGATING: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: []
};

/**
 * Valid operational lifecycle transitions for Alerts
 */
export const VALID_ALERT_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "ESCALATED", "RESOLVED", "SUPPRESSED"],
  ACTIVE: ["ACKNOWLEDGED", "ESCALATED", "RESOLVED", "SUPPRESSED"],
  ACKNOWLEDGED: ["ESCALATED", "RESOLVED", "SUPPRESSED"],
  ESCALATED: ["RESOLVED"],
  RESOLVED: [],
  SUPPRESSED: []
};

