import { z } from "zod";
import { RiskBand, MaintenanceType } from "@prisma/client";

export const predictionsQuerySchema = z.object({
  stationId: z.string().optional(),
  riskBand: z.nativeEnum(RiskBand).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const equipmentIdParamSchema = z.object({
  equipmentId: z.string().min(1, "equipmentId is required")
});

export const healthOverviewQuerySchema = z.object({
  stationId: z.string().optional()
});

export const predictionHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(30)
});

export const createWorkOrderSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(5, "Description must be at least 5 characters"),
  type: z.nativeEnum(MaintenanceType).default(MaintenanceType.PREVENTIVE),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "scheduledAt must be a valid ISO date string"
  }),
  assignedTo: z.string().max(80).optional()
});
