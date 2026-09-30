import { AlertSeverity, AlertStatus, EquipmentCategory, EquipmentStatus, IncidentCategory, IncidentImpact, IncidentSeverity, IncidentStatus, StationStatus, UserRole } from "@prisma/client";
import { StationCode, ScenarioType } from "../../simulator/models/simulator.types";

/**
 * Standard WebSocket and Domain Event Types for POLARIS Live Monitoring
 */
export const REALTIME_EVENT_TYPES = {
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
  INCIDENT_CLOSED: "incident:closed",
  SCENARIO_ACTIVE: "scenario:active",
  STATION_STATUS: "station:status",
  EQUIPMENT_UPDATE: "equipment:update",
  SYSTEM_STATUS: "system:status",
  STATION_SNAPSHOT: "station:snapshot",
  HEARTBEAT_PING: "heartbeat:ping",
  HEARTBEAT_PONG: "heartbeat:pong",
  MAINTENANCE_PREDICTION_UPDATED: "maintenance:prediction_updated",
  MAINTENANCE_WORK_ORDER_CREATED: "maintenance:work_order_created"
} as const;

export type RealtimeEventType = (typeof REALTIME_EVENT_TYPES)[keyof typeof REALTIME_EVENT_TYPES];

/**
 * Client-to-Server Message Types
 */
export const CLIENT_MESSAGE_TYPES = {
  STATION_SUBSCRIBE: "station:subscribe",
  STATION_UNSUBSCRIBE: "station:unsubscribe",
  HEARTBEAT_PONG: "heartbeat:pong"
} as const;

export type ClientMessageType = (typeof CLIENT_MESSAGE_TYPES)[keyof typeof CLIENT_MESSAGE_TYPES];

/**
 * Standard Event Envelope (Section 7 Specification)
 */
export interface EventEnvelope<T = unknown> {
  type: RealtimeEventType;
  eventId: string;
  timestamp: string; // ISO 8601 UTC
  stationId?: string;
  stationCode?: StationCode;
  sequence: number;
  data: T;
}

/**
 * Compact Frontend-Friendly Telemetry Update Payload (Section 6 Specification)
 */
export interface TelemetryUpdatePayload {
  stationId: string;
  stationCode: StationCode;
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
    status: StationStatus;
  };
  equipmentSummary: Array<{
    equipmentId: string;
    healthPercent: number;
    status: EquipmentStatus;
    temperature: number;
    vibration: number;
    runtimeHours: number;
    notes?: string;
  }>;
}

/**
 * Alert Triggered Event Payload (Deduplicated)
 */
export interface AlertTriggeredPayload {
  id: string;
  stationCode: StationCode;
  stationId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  category?: string;
  sourceEquipmentCode?: string;
  triggeredAt: string;
}

/**
 * Phase 9 Operational Alert Event Payload
 */
export interface AlertEventPayload {
  id: string;
  stationId: string;
  stationCode: StationCode;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  ruleCode?: string;
  sourceType?: string;
  sourceId?: string;
  triggerValue?: number;
  thresholdValue?: number;
  unit?: string;
  occurrenceCount: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  timestamp: string;
}

/**
 * Phase 9 Operational Incident Event Payload
 */
export interface IncidentEventPayload {
  id: string;
  stationId: string;
  stationCode: StationCode;
  incidentNumber: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  impact?: IncidentImpact;
  assignedTo?: string;
  assignedUserName?: string;
  startedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  timestamp: string;
}

/**
 * Scenario Active / Changed Event Payload
 */
export interface ScenarioActivePayload {
  scenario: ScenarioType;
  stationCode: StationCode;
  intensity: number;
  status: "STARTED" | "ACTIVE" | "STOPPED";
  startTimestamp: string;
  elapsedSeconds: number;
  affectedSubsystem: string;
  diagnosticNote?: string;
}

/**
 * Equipment Update Event Payload
 */
export interface EquipmentUpdatePayload {
  equipmentId: string;
  equipmentCode?: string;
  stationCode: StationCode;
  status: EquipmentStatus;
  healthPercent: number;
  temperature: number;
  vibration: number;
  runtimeHours: number;
  notes?: string;
  timestamp: string;
}

/**
 * Station Operational Status Change Payload
 */
export interface StationStatusPayload {
  stationCode: StationCode;
  stationId: string;
  status: StationStatus;
  healthPercent: number;
  previousStatus?: StationStatus;
  timestamp: string;
}

/**
 * Realtime System Metrics Payload
 */
export interface SystemStatusPayload {
  status: "HEALTHY" | "DEGRADED";
  connectedClients: number;
  activeSubscriptions: number;
  messagesSent: number;
  messagesFailed: number;
  lastBroadcastAt: string | null;
  serverTime: string;
}

/**
 * Authenticated User Context for WebSocket Connections
 */
export interface AuthenticatedUserContext {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Client Inbound Message Shapes
 */
export interface StationSubscribeMessage {
  type: typeof CLIENT_MESSAGE_TYPES.STATION_SUBSCRIBE;
  stations: (StationCode | "ALL")[];
}

export interface StationUnsubscribeMessage {
  type: typeof CLIENT_MESSAGE_TYPES.STATION_UNSUBSCRIBE;
  stations: (StationCode | "ALL")[];
}

export interface HeartbeatPongMessage {
  type: typeof CLIENT_MESSAGE_TYPES.HEARTBEAT_PONG;
  timestamp?: string;
}

export type ClientInboundMessage =
  | StationSubscribeMessage
  | StationUnsubscribeMessage
  | HeartbeatPongMessage;

/**
 * Realtime Service Metrics
 */
export interface RealtimeMetrics {
  status: "HEALTHY" | "DEGRADED";
  connectedClients: number;
  activeSubscriptions: number;
  messagesSent: number;
  messagesFailed: number;
  lastBroadcastAt: Date | null;
  uptimeSeconds: number;
}

export {
  REALTIME_EVENT_TYPES as WS_EVENT_TYPES,
  CLIENT_MESSAGE_TYPES as WS_CLIENT_MESSAGES
};

export type WsEventEnvelope<T = unknown> = EventEnvelope<T>;
export type WsTelemetryPayload = TelemetryUpdatePayload;
