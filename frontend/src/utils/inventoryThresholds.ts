/**
 * POLARIS — Frontend Inventory & Logistics Status Evaluation Engine
 * Phase 8: Logistics + Inventory Management
 * 
 * Centralized, deterministic threshold evaluation aligned with:
 * - NCPOR Antarctic Station Operating Safety Standards (Maitri & Bharati)
 * - Safe minimum reserve & critical winter-over thresholds
 */

export type OperationalInventoryStatus = "IN_STOCK" | "LOW_STOCK" | "CRITICAL" | "OUT_OF_STOCK" | "RESERVED" | "IN_TRANSIT" | "UNKNOWN";

export interface InventoryStatusEvaluation {
  status: OperationalInventoryStatus;
  label: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  description: string;
  isActionRequired: boolean;
}

export const INVENTORY_STATUS_THEMES: Record<OperationalInventoryStatus, Omit<InventoryStatusEvaluation, "description" | "isActionRequired">> = {
  IN_STOCK: {
    status: "IN_STOCK",
    label: "Optimal Reserve",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-500/10"
  },
  LOW_STOCK: {
    status: "LOW_STOCK",
    label: "Low Stock / Reorder",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-500/10"
  },
  CRITICAL: {
    status: "CRITICAL",
    label: "Critical Reserve",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-500/10"
  },
  OUT_OF_STOCK: {
    status: "OUT_OF_STOCK",
    label: "Depleted (0)",
    badgeClass: "bg-red-600/20 text-red-400 border-red-500/50",
    textClass: "text-red-400",
    borderClass: "border-red-500/50",
    bgClass: "bg-red-600/20"
  },
  RESERVED: {
    status: "RESERVED",
    label: "Reserved / Allocated",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-500/10"
  },
  IN_TRANSIT: {
    status: "IN_TRANSIT",
    label: "In Transit",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    bgClass: "bg-cyan-500/10"
  },
  UNKNOWN: {
    status: "UNKNOWN",
    label: "Pending Audit",
    badgeClass: "bg-slate-700/20 text-slate-400 border-slate-700/40",
    textClass: "text-slate-400",
    borderClass: "border-slate-700/40",
    bgClass: "bg-slate-700/20"
  }
};

export interface InventoryItemEvaluationInput {
  quantity: number;
  minimumQuantity: number;
  criticalQuantity?: number | null;
  reservedQuantity?: number | null;
  unit?: string;
}

/**
 * Deterministically evaluates inventory operational status based on quantity,
 * reorder threshold, critical safety reserve, and allocated quantities.
 */
export function evaluateInventoryStatus(
  input: InventoryItemEvaluationInput
): InventoryStatusEvaluation {
  const { quantity, minimumQuantity, criticalQuantity, reservedQuantity = 0 } = input;
  const criticalThreshold = criticalQuantity != null && criticalQuantity > 0 
    ? criticalQuantity 
    : minimumQuantity * 0.5;

  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return {
      ...INVENTORY_STATUS_THEMES.UNKNOWN,
      description: "Stock count has not yet been audited or telemetry is offline.",
      isActionRequired: true
    };
  }

  // 1. Depleted / Zero Stock
  if (quantity <= 0) {
    return {
      ...INVENTORY_STATUS_THEMES.OUT_OF_STOCK,
      description: "Immediate stock shortage. Critical resupply or transfer required.",
      isActionRequired: true
    };
  }

  // 2. Critical Reserve
  if (quantity <= criticalThreshold) {
    return {
      ...INVENTORY_STATUS_THEMES.CRITICAL,
      description: `Stock (${quantity}) is at or below critical safety floor (${criticalThreshold.toFixed(1)}). Expedition resilience at risk.`,
      isActionRequired: true
    };
  }

  // 3. Low Stock / Reorder Point
  if (quantity <= minimumQuantity) {
    return {
      ...INVENTORY_STATUS_THEMES.LOW_STOCK,
      description: `Stock (${quantity}) is below reorder threshold (${minimumQuantity.toFixed(1)}). Schedule replenishment shipment.`,
      isActionRequired: true
    };
  }

  // 4. Reserved Allocation Warning (if entire or major stock is reserved)
  if (reservedQuantity && reservedQuantity > 0 && (quantity - reservedQuantity) <= criticalThreshold) {
    return {
      ...INVENTORY_STATUS_THEMES.RESERVED,
      description: `Unreserved available stock (${(quantity - reservedQuantity).toFixed(1)}) is at critical level due to active allocations.`,
      isActionRequired: true
    };
  }

  // 5. Optimal / In Stock
  return {
    ...INVENTORY_STATUS_THEMES.IN_STOCK,
    description: `Stock levels are healthy and within polar operating parameters.`,
    isActionRequired: false
  };
}

/**
 * Standard Antarctic Logistics Categories
 */
export const INVENTORY_CATEGORIES = [
  "Fuel & Lubricants",
  "Spare Parts & Tools",
  "Food & Rations",
  "Medical Supplies",
  "Scientific Consumables",
  "Safety & Survival Gear",
  "Extreme Cold Clothing",
  "Electrical & Batteries",
  "Satellite & Telecom",
  "Water & Treatment",
  "General Logistics"
] as const;

export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

/**
 * Standard Units of Measure
 */
export const INVENTORY_UNITS = [
  "Liters",
  "Units",
  "Kg",
  "Packs",
  "Kits",
  "Drums",
  "Cylinders",
  "Boxes",
  "Meters"
] as const;
