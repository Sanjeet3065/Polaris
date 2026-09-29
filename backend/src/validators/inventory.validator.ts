import { z } from "zod";
import { InventoryStatus, StockMovementType, ShipmentStatus, ShipmentPriority } from "@prisma/client";

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  station: z.string().optional(),
  category: z.string().optional(),
  status: z.nativeEnum(InventoryStatus).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "quantity", "sku", "category", "status", "lastUpdatedAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc")
});

export const createInventoryItemSchema = z.object({
  stationId: z.string().min(1, "Station identifier is required"),
  sku: z.string().min(2, "SKU must be at least 2 characters").max(50),
  name: z.string().min(2, "Item name must be at least 2 characters").max(200),
  category: z.string().min(2, "Category is required").max(100),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit of measurement is required").max(50),
  minimumQuantity: z.number().min(0, "Minimum reorder quantity cannot be negative"),
  criticalQuantity: z.number().min(0, "Critical reserve quantity cannot be negative").optional(),
  reservedQuantity: z.number().min(0).optional().default(0),
  storageLocation: z.string().max(200).optional(),
  description: z.string().max(1000).optional()
}).refine(
  (data) => {
    if (data.criticalQuantity != null && data.criticalQuantity > data.minimumQuantity) {
      return false;
    }
    return true;
  },
  {
    message: "Critical reserve quantity should not exceed minimum reorder threshold",
    path: ["criticalQuantity"]
  }
);

export const updateInventoryItemSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  category: z.string().min(2).max(100).optional(),
  minimumQuantity: z.number().min(0).optional(),
  criticalQuantity: z.number().min(0).optional(),
  storageLocation: z.string().max(200).optional(),
  description: z.string().max(1000).optional()
});

export const recordStockMovementSchema = z.object({
  type: z.nativeEnum(StockMovementType, {
    errorMap: () => ({ message: "Valid movement type (RECEIVED, CONSUMED, TRANSFERRED, ADJUSTED, RESERVED, RELEASED) is required" })
  }),
  quantity: z.number().positive("Quantity must be greater than zero"),
  source: z.string().max(200).optional(),
  destination: z.string().max(200).optional(),
  reference: z.string().max(100).optional(),
  reason: z.string().min(2, "Operational reason or authorization is required").max(500)
});

export const transferStockSchema = z.object({
  sourceStationId: z.string().min(1, "Source station is required"),
  targetStationId: z.string().min(1, "Destination station is required"),
  itemId: z.string().min(1, "Item to transfer is required"),
  quantity: z.number().positive("Transfer quantity must be greater than zero"),
  reference: z.string().max(100).optional(),
  reason: z.string().min(2, "Operational justification for transfer is required").max(500)
}).refine(
  (data) => data.sourceStationId !== data.targetStationId,
  {
    message: "Source and destination stations cannot be the same",
    path: ["targetStationId"]
  }
);

export const shipmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  station: z.string().optional(),
  status: z.nativeEnum(ShipmentStatus).optional(),
  priority: z.nativeEnum(ShipmentPriority).optional(),
  search: z.string().optional()
});

export const createShipmentItemSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().min(2, "Cargo item name is required").max(200),
  category: z.string().min(2, "Category is required").max(100),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required").max(50)
});

export const createShipmentSchema = z.object({
  shipmentNumber: z.string().min(2).max(50).optional(),
  title: z.string().min(3, "Shipment title is required").max(200),
  origin: z.string().min(2, "Origin location is required").max(200),
  destinationStationId: z.string().optional(),
  destination: z.string().min(2, "Destination is required").max(200),
  priority: z.nativeEnum(ShipmentPriority).optional().default(ShipmentPriority.NORMAL),
  plannedDeparture: z.string().datetime().optional(),
  estimatedArrival: z.string().datetime().optional(),
  carrier: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(createShipmentItemSchema).min(1, "At least one cargo manifest item is required")
});

export const updateShipmentStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  actualDeparture: z.string().datetime().optional(),
  actualArrival: z.string().datetime().optional(),
  notes: z.string().max(1000).optional()
});

export const receiveShipmentSchema = z.object({
  items: z.array(
    z.object({
      shipmentItemId: z.string().min(1),
      receivedQty: z.number().positive("Received quantity must be positive")
    })
  ).min(1, "At least one shipment item must be received"),
  notes: z.string().max(1000).optional()
});
