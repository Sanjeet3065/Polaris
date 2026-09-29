import { StationFilter } from "../../types";

export type WsConnectionState = "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "ERROR";
export type RealtimeConnectionStatus = "LIVE" | "RECONNECTING" | "OFFLINE";

export const WS_EVENT_TYPES = {
  TELEMETRY_UPDATE: "telemetry:update",
  ALERT_TRIGGERED: "alert:triggered",
  ALERT_CREATED: "alert:created",
  ALERT_UPDATED: "alert:updated",
  ALERT_ACKNOWLEDGED: "alert:acknowledged",
  ALERT_ESCALATED: "alert:escalated",
  ALERT_RESOLVED: "alert:resolved",
  ALERT_SUPPRESSED: "alert:suppressed",
  INCIDENT_CREATED: "incident:created",
  INCIDENT_UPDATED: "incident:updated",
  INCIDENT_STATUS_CHANGED: "incident:status_changed",
  INCIDENT_ASSIGNED: "incident:assigned",
  INCIDENT_RESOLVED: "incident:resolved",
  SCENARIO_ACTIVE: "scenario:active",
  STATION_STATUS: "station:status",
  EQUIPMENT_UPDATE: "equipment:update",
  SYSTEM_STATUS: "system:status",
  STATION_SNAPSHOT: "station:snapshot",
  HEARTBEAT_PING: "heartbeat:ping",
  HEARTBEAT_PONG: "heartbeat:pong"
} as const;

export type WsEventType = (typeof WS_EVENT_TYPES)[keyof typeof WS_EVENT_TYPES];

export const WS_CLIENT_MESSAGES = {
  STATION_SUBSCRIBE: "station:subscribe",
  STATION_UNSUBSCRIBE: "station:unsubscribe",
  HEARTBEAT_PONG: "heartbeat:pong"
} as const;

export type WsClientMessageType = (typeof WS_CLIENT_MESSAGES)[keyof typeof WS_CLIENT_MESSAGES];

/**
 * Standard Inbound Event Envelope (Section 7)
 */
export interface WsEventEnvelope<T = unknown> {
  type: WsEventType;
  eventId: string;
  timestamp: string;
  stationId?: string;
  stationCode?: "MAITRI" | "BHARATI";
  sequence: number;
  data: T;
}

/**
 * Telemetry Payload
 */
export interface WsTelemetryPayload {
  stationId: string;
  stationCode: "MAITRI" | "BHARATI";
  timestamp: string;
  environment: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windDirectionCompass: string;
    visibility: number;
    solarRadiation: number;
    snowfallRate: number;
  };
  energy: {
    generationKw: number;
    solarKw: number;
    dieselKw: number;
    consumptionKw: number;
    netPowerKw: number;
    batteryPercent: number;
    batteryVoltage: number;
    fuelPercent: number;
    fuelLiters: number;
    fuelDaysRemaining: number;
  };
  station: {
    healthPercent: number;
    status: "OPERATIONAL" | "DEGRADED" | "WARNING" | "CRITICAL" | "OFFLINE";
  };
  equipmentSummary: Array<{
    equipmentId: string;
    healthPercent: number;
    status: "OPERATIONAL" | "DEGRADED" | "WARNING" | "CRITICAL" | "OFFLINE" | "MAINTENANCE";
    temperature: number;
    vibration: number;
    runtimeHours: number;
    notes?: string;
  }>;
}

/**
 * Alert Triggered Payload
 */
export interface WsAlertPayload {
  id: string;
  stationCode: "MAITRI" | "BHARATI";
  stationId: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  category?: string;
  sourceEquipmentCode?: string;
  triggeredAt: string;
}

/**
 * Scenario Active Payload
 */
export interface WsScenarioPayload {
  scenario: string;
  stationCode: "MAITRI" | "BHARATI";
  intensity: number;
  status: "STARTED" | "ACTIVE" | "STOPPED";
  startTimestamp: string;
  elapsedSeconds: number;
  affectedSubsystem: string;
  diagnosticNote?: string;
}

/**
 * Equipment Update Payload
 */
export interface WsEquipmentPayload {
  equipmentId: string;
  stationCode: "MAITRI" | "BHARATI";
  status: "OPERATIONAL" | "DEGRADED" | "WARNING" | "CRITICAL" | "OFFLINE" | "MAINTENANCE";
  healthPercent: number;
  temperature: number;
  vibration: number;
  runtimeHours: number;
  notes?: string;
  timestamp: string;
}

/**
 * Station Status Payload
 */
export interface WsStationStatusPayload {
  stationCode: "MAITRI" | "BHARATI";
  stationId: string;
  status: "OPERATIONAL" | "DEGRADED" | "WARNING" | "CRITICAL" | "OFFLINE";
  healthPercent: number;
  previousStatus?: string;
  timestamp: string;
}

/**
 * System Status Payload
 */
export interface WsSystemStatusPayload {
  status: "HEALTHY" | "DEGRADED";
  connectedClients: number;
  activeSubscriptions: number;
  messagesSent: number;
  messagesFailed: number;
  lastBroadcastAt: string | null;
  serverTime: string;
}

/**
 * Outbound Client Messages
 */
export interface WsSubscribeMessage {
  type: typeof WS_CLIENT_MESSAGES.STATION_SUBSCRIBE;
  stations: StationFilter[];
}

export interface WsUnsubscribeMessage {
  type: typeof WS_CLIENT_MESSAGES.STATION_UNSUBSCRIBE;
  stations: StationFilter[];
}

export interface WsPongMessage {
  type: typeof WS_CLIENT_MESSAGES.HEARTBEAT_PONG;
  timestamp: string;
}
