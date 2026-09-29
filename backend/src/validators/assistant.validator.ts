import { z } from "zod";

export const assistantChatBodySchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters")
    .trim(),
  conversationId: z.string().optional(),
  stationId: z.string().optional(),
  timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "custom"]).optional()
});

export const conversationIdParamSchema = z.object({
  id: z.string().min(1, "Conversation ID is required")
});

export const assistantSuggestionsQuerySchema = z.object({
  station: z.string().optional().default("MAITRI")
});
