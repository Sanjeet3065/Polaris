import { z } from "zod";

const timeRangeEnum = z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]);

export const analyticsFilterQuerySchema = z.object({
  stationId: z.string().optional(),
  timeRange: timeRangeEnum.optional().default("24h"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  equipmentId: z.string().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional()
});

export const reportTypeEnum = z.enum([
  "DAILY_OPERATIONS",
  "WEEKLY_OPERATIONS",
  "ENERGY_ANALYSIS",
  "ENVIRONMENT_CLIMATE",
  "EQUIPMENT_HEALTH",
  "ALERTS_INCIDENTS",
  "MAINTENANCE_INTELLIGENCE",
  "LOGISTICS_INVENTORY",
  "STATION_COMPARISON"
]);

export const generateReportBodySchema = z.object({
  reportType: reportTypeEnum,
  stationId: z.string().optional(),
  timeRange: timeRangeEnum.optional().default("24h"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  title: z.string().max(150).optional()
});

export const reportIdParamSchema = z.object({
  reportId: z.string().min(1, "Report ID is required")
});

export const exportReportQuerySchema = z.object({
  format: z.enum(["json", "csv", "html"]).optional().default("csv")
});
