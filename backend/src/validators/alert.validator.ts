import { z } from "zod";
import { AlertSeverity, AlertStatus, IncidentStatus, IncidentSeverity, IncidentCategory, IncidentImpact } from "@prisma/client";

// ============================================================
// ALERT VALIDATION SCHEMAS
// ============================================================

export const alertQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  stationId: z.string().optional(),
  severity: z.nativeEnum(AlertSeverity).optional(),
  status: z.nativeEnum(AlertStatus).optional(),
  sourceType: z.string().optional(),
  ruleCode: z.string().optional(),
  search: z.string().optional()
});

export const createAlertSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  severity: z.nativeEnum(AlertSeverity),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().optional(),
  message: z.string().min(3, "Message must be at least 3 characters").max(1000),
  source: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  equipmentId: z.string().optional(),
  ruleCode: z.string().optional(),
  triggerValue: z.number().optional(),
  thresholdValue: z.number().optional(),
  unit: z.string().optional(),
  metadata: z.union([z.string(), z.record(z.unknown())]).optional()
});

export const acknowledgeAlertSchema = z.object({
  note: z.string().max(500).optional()
});

export const escalateAlertSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(5).max(2000).optional(),
  severity: z.nativeEnum(IncidentSeverity).optional(),
  category: z.nativeEnum(IncidentCategory).optional(),
  impact: z.nativeEnum(IncidentImpact).optional(),
  assignedTo: z.string().optional(),
  note: z.string().max(1000).optional()
});

export const resolveAlertSchema = z.object({
  note: z.string().max(1000).optional()
});

export const suppressAlertSchema = z.object({
  reason: z.string().min(3, "Suppression reason must be at least 3 characters").max(500)
});

// ============================================================
// INCIDENT VALIDATION SCHEMAS
// ============================================================

export const incidentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  stationId: z.string().optional(),
  status: z.nativeEnum(IncidentStatus).optional(),
  severity: z.nativeEnum(IncidentSeverity).optional(),
  category: z.nativeEnum(IncidentCategory).optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional()
});

export const createIncidentSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  title: z.string().min(3, "Incident title must be at least 3 characters").max(200),
  description: z.string().min(5, "Incident description must be at least 5 characters").max(5000),
  severity: z.nativeEnum(IncidentSeverity),
  category: z.nativeEnum(IncidentCategory),
  impact: z.nativeEnum(IncidentImpact).default(IncidentImpact.MEDIUM),
  assignedTo: z.string().optional(),
  alertIds: z.array(z.string()).optional()
});

export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(5).max(5000).optional(),
  severity: z.nativeEnum(IncidentSeverity).optional(),
  category: z.nativeEnum(IncidentCategory).optional(),
  impact: z.nativeEnum(IncidentImpact).optional(),
  rootCause: z.string().max(2000).optional(),
  resolutionSummary: z.string().max(2000).optional()
});

export const updateIncidentStatusSchema = z.object({
  status: z.nativeEnum(IncidentStatus),
  note: z.string().max(1000).optional(),
  resolutionSummary: z.string().max(2000).optional()
});

export const assignIncidentSchema = z.object({
  assignedTo: z.string().min(1, "Assigned user ID is required")
});

export const incidentNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty").max(2000)
});

export const linkAlertSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required")
});

export type AlertQueryInput = z.infer<typeof alertQuerySchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;
export type EscalateAlertInput = z.infer<typeof escalateAlertSchema>;
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
export type SuppressAlertInput = z.infer<typeof suppressAlertSchema>;

export type IncidentQueryInput = z.infer<typeof incidentQuerySchema>;
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type AssignIncidentInput = z.infer<typeof assignIncidentSchema>;
export type IncidentNoteInput = z.infer<typeof incidentNoteSchema>;
export type LinkAlertInput = z.infer<typeof linkAlertSchema>;
