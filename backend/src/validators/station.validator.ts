import { z } from "zod";
import {
  EquipmentCategory,
  EquipmentStatus,
  AlertSeverity,
  AlertStatus,
  InventoryStatus,
  MaintenanceStatus
} from "@prisma/client";

// Station identifier: either UUID or alphanumeric station code (e.g. MAITRI, BHARATI)
export const stationIdParamSchema = z.object({
  stationId: z
    .string()
    .min(1, "Station identifier is required")
    .max(64, "Station identifier is too long")
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const historyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    from: z
      .string()
      .datetime({ message: "Invalid 'from' timestamp. Must be ISO 8601 format." })
      .optional(),
    to: z
      .string()
      .datetime({ message: "Invalid 'to' timestamp. Must be ISO 8601 format." })
      .optional()
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    {
      message: "'from' timestamp must be earlier than or equal to 'to' timestamp",
      path: ["from"]
    }
  );

export const equipmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: z.nativeEnum(EquipmentCategory).optional(),
  status: z.nativeEnum(EquipmentStatus).optional()
});

export const alertQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  severity: z.nativeEnum(AlertSeverity).optional(),
  status: z.nativeEnum(AlertStatus).optional()
});

export const eventQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    type: z.string().optional(),
    from: z
      .string()
      .datetime({ message: "Invalid 'from' timestamp. Must be ISO 8601 format." })
      .optional(),
    to: z
      .string()
      .datetime({ message: "Invalid 'to' timestamp. Must be ISO 8601 format." })
      .optional()
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    {
      message: "'from' timestamp must be earlier than or equal to 'to' timestamp",
      path: ["from"]
    }
  );

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: z.string().optional(),
  status: z.nativeEnum(InventoryStatus).optional()
});

export const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.nativeEnum(MaintenanceStatus).optional()
});
