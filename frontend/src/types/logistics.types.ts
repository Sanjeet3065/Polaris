import { InventoryStatusEvaluation } from "../utils/inventoryThresholds";

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "CRITICAL" | "OUT_OF_STOCK";

export type StockMovementType = "RECEIVED" | "CONSUMED" | "TRANSFERRED" | "ADJUSTED" | "RESERVED" | "RELEASED";

export type ShipmentStatus = "PLANNED" | "READY" | "IN_TRANSIT" | "ARRIVED" | "RECEIVED" | "CANCELLED";

export type ShipmentPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface InventoryItem {
  id: string;
  stationId: string;
  station?: {
    id: string;
    code: string;
    name: string;
  };
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  criticalQuantity?: number | null;
  reservedQuantity: number;
  storageLocation?: string | null;
  description?: string | null;
  status: InventoryStatus;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  evaluation?: InventoryStatusEvaluation;
  movements?: InventoryMovement[];
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  stationId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  source?: string | null;
  destination?: string | null;
  reference?: string | null;
  reason?: string | null;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string;
  item?: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    category?: string;
  };
  station?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  itemId?: string | null;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  receivedQty: number;
  createdAt: string;
  item?: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unit: string;
  } | null;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  title: string;
  origin: string;
  destinationStationId?: string | null;
  destinationStation?: {
    id: string;
    code: string;
    name: string;
  } | null;
  destination: string;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  plannedDeparture?: string | null;
  actualDeparture?: string | null;
  estimatedArrival?: string | null;
  actualArrival?: string | null;
  carrier?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  items: ShipmentItem[];
  lifecycle?: {
    currentStep: ShipmentStatus;
    currentStepIndex: number;
    isCancelled: boolean;
    isCompleted: boolean;
    progressPercent: number;
    steps?: {
      status: ShipmentStatus;
      completed: boolean;
      current: boolean;
    }[];
  };
}

export interface InventoryOverview {
  totalItems: number;
  inStock: number;
  lowStock: number;
  criticalStock: number;
  outOfStock: number;
  totalCategories: number;
  categories: { category: string; count: number }[];
}

export interface LogisticsOverview {
  totalShipments: number;
  planned: number;
  ready: number;
  inTransit: number;
  arrived: number;
  received: number;
  cancelled: number;
}
