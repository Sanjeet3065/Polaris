import { z } from "zod";
import { CLIENT_MESSAGE_TYPES } from "../events/realtime.types";

const stationEnum = z.enum(["MAITRI", "BHARATI", "ALL"]);

export const stationSubscribeSchema = z.object({
  type: z.literal(CLIENT_MESSAGE_TYPES.STATION_SUBSCRIBE),
  stations: z
    .array(stationEnum)
    .min(1, "At least one station required for subscription")
    .max(3, "Cannot subscribe to more than 3 station selectors")
});

export const stationUnsubscribeSchema = z.object({
  type: z.literal(CLIENT_MESSAGE_TYPES.STATION_UNSUBSCRIBE),
  stations: z
    .array(stationEnum)
    .min(1, "At least one station required for unsubscription")
    .max(3)
});

export const heartbeatPongSchema = z.object({
  type: z.literal(CLIENT_MESSAGE_TYPES.HEARTBEAT_PONG),
  timestamp: z.string().optional()
});

export const clientMessageSchema = z.discriminatedUnion("type", [
  stationSubscribeSchema,
  stationUnsubscribeSchema,
  heartbeatPongSchema
]);

export type ValidatedClientMessage = z.infer<typeof clientMessageSchema>;
