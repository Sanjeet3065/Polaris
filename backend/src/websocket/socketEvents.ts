/**
 * WebSocket Event Constants for POLARIS Live Telemetry
 * Matches SIH26060 Real-Time Telemetry & Monitoring Architecture
 */
export const SOCKET_EVENTS = {
  // Client Connection Lifecycle
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  RECONNECT: "reconnect",
  ERROR: "error",

  // Telemetry & State Streams
  SENSOR_UPDATE: "sensor:update",
  STATION_UPDATE: "station:update",
  ENVIRONMENT_UPDATE: "environment:update",
  ENERGY_UPDATE: "energy:update",
  EQUIPMENT_UPDATE: "equipment:update",

  // Operations & Alerts
  ALERT_NEW: "alert:new",
  ALERT_UPDATE: "alert:update",
  MAINTENANCE_UPDATE: "maintenance:update",
  INVENTORY_UPDATE: "inventory:update",

  // Client Subscription Rooms
  SUBSCRIBE_STATION: "subscribe:station",
  UNSUBSCRIBE_STATION: "unsubscribe:station"
} as const;

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

export type ConnectionStatus = "LIVE" | "RECONNECTING" | "OFFLINE";
