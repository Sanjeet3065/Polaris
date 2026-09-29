import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { webSocketAuthService } from "./websocket.auth";
import { webSocketRegistry } from "./websocket.registry";
import { webSocketBroadcastService } from "./websocket.broadcast";
import { webSocketHeartbeatManager } from "./websocket.heartbeat";
import { realtimeEventBus } from "../events/realtime.eventbus";
import {
  EventEnvelope,
  REALTIME_EVENT_TYPES,
  CLIENT_MESSAGE_TYPES,
  StationSubscribeMessage,
  StationUnsubscribeMessage
} from "../events/realtime.types";
import { clientMessageSchema } from "./websocket.validator";
import { StationCode } from "../../simulator/models/simulator.types";
import { simulationEngine } from "../../simulator/engine/simulation.engine";
import { STATION_BASELINES } from "../../simulator/config/station-baselines";
import { sequenceManager } from "../events/sequence.manager";

/**
 * Production-Quality WebSocket Server (Sections 2, 3, 9, 12, 16, 38, 50)
 */
export class PolarisWebSocketServer {
  private static instance: PolarisWebSocketServer;
  private wss: WebSocketServer | null = null;
  private isInitialized = false;
  private eventBusUnsubscribers: Array<() => void> = [];

  private constructor() {}

  public static getInstance(): PolarisWebSocketServer {
    if (!PolarisWebSocketServer.instance) {
      PolarisWebSocketServer.instance = new PolarisWebSocketServer();
    }
    return PolarisWebSocketServer.instance;
  }

  /**
   * Initializes WebSocket Server on the existing HTTP server instance
   */
  public initialize(server: http.Server): void {
    if (this.isInitialized) return;

    if (!env.WEBSOCKET_ENABLED) {
      logger.info("WEBSOCKET_DISABLED: Skipping WebSocket server activation per configuration");
      return;
    }

    this.wss = new WebSocketServer({
      noServer: true,
      maxPayload: env.WEBSOCKET_MAX_MESSAGE_SIZE
    });

    // Handle HTTP Upgrade requests
    server.on("upgrade", async (req, socket, head) => {
      try {
        const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : "";

        // Only handle designated WebSocket paths
        if (pathname !== "/ws" && pathname !== "/api/v1/realtime/ws" && pathname !== "/api/v1/ws") {
          return; // Let other upgrade handlers or 404 take over
        }

        // 1. Enforce Connection Limits (Section 38)
        const currentConnections = webSocketRegistry.getMetrics().connectedClients;
        if (currentConnections >= env.WEBSOCKET_MAX_CONNECTIONS) {
          logger.warn("WEBSOCKET_LIMIT_REACHED: Rejecting connection - max connections reached", {
            current: currentConnections,
            max: env.WEBSOCKET_MAX_CONNECTIONS
          });
          socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\nConnection limit exceeded");
          socket.destroy();
          return;
        }

        // 2. Validate Origin Header against CORS_ORIGIN (Section 40)
        const origin = req.headers.origin;
        if (origin && env.NODE_ENV === "production" && env.CORS_ORIGIN !== "*") {
          const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
          const isAllowed =
            allowedOrigins.includes(origin) ||
            origin.endsWith(".vercel.app") ||
            origin.includes("localhost") ||
            origin.includes("127.0.0.1");

          if (!isAllowed) {
            logger.warn("WEBSOCKET_FORBIDDEN_ORIGIN: Origin mismatch in production", { origin, allowedOrigins });
            socket.write("HTTP/1.1 403 Forbidden\r\n\r\nOrigin not allowed");
            socket.destroy();
            return;
          }
        }

        // 3. Authenticate Handshake via Phase 3 JWT (Section 9)
        const authResult = await webSocketAuthService.authenticateHandshake(req);
        if (!authResult.authenticated || !authResult.user) {
          const status = authResult.statusCode || 401;
          const statusText = status === 403 ? "Forbidden" : "Unauthorized";
          socket.write(`HTTP/1.1 ${status} ${statusText}\r\n\r\n${authResult.reason || "Authentication Failed"}`);
          socket.destroy();
          return;
        }

        // 4. Upgrade connection to WebSocket
        this.wss?.handleUpgrade(req, socket, head, (ws) => {
          this.handleConnection(ws, authResult.user!, req.socket.remoteAddress);
        });
      } catch (err) {
        logger.error("WEBSOCKET_UPGRADE_ERROR: Fatal error during HTTP upgrade handshake", err as Error);
        socket.destroy();
      }
    });

    // Wire Realtime Event Bus to WebSocket Broadcaster
    this.wireDomainEvents();

    // Start background Heartbeat Manager
    webSocketHeartbeatManager.start();

    this.isInitialized = true;
    logger.info("WEBSOCKET_SERVER_STARTED: Real-time monitoring engine initialized", {
      endpoints: ["/ws", "/api/v1/realtime/ws"],
      maxConnections: env.WEBSOCKET_MAX_CONNECTIONS,
      heartbeatIntervalMs: env.WEBSOCKET_HEARTBEAT_INTERVAL_MS
    });
  }

  /**
   * Configures connection events and listeners for an authenticated client
   */
  private handleConnection(
    ws: WebSocket,
    user: import("../events/realtime.types").AuthenticatedUserContext,
    clientIp?: string
  ): void {
    const connection = webSocketRegistry.register(ws, user, clientIp);

    // Safe default subscription (Section 14): Connection initially receives system status,
    // then explicitly subscribes to station telemetry feeds.
    webSocketBroadcastService.sendToClient(ws, {
      type: REALTIME_EVENT_TYPES.SYSTEM_STATUS,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sequence: sequenceManager.nextSequence("GLOBAL"),
      data: {
        status: "HEALTHY",
        connectedClients: webSocketRegistry.getMetrics().connectedClients,
        activeSubscriptions: 0,
        messagesSent: 0,
        messagesFailed: 0,
        lastBroadcastAt: null,
        serverTime: new Date().toISOString()
      }
    });

    // Native WebSocket Ping/Pong handler
    ws.on("pong", () => {
      webSocketRegistry.markAlive(connection.id);
    });

    // Inbound client message handler
    ws.on("message", (data: unknown, isBinary: boolean) => {
      if (isBinary) {
        logger.warn("WEBSOCKET_REJECTED_BINARY: Binary frames are not supported", { connectionId: connection.id });
        return;
      }

      this.handleClientMessage(connection.id, ws, data);
    });

    // Disconnect and Error handlers
    ws.on("close", (code, reason) => {
      logger.info("WEBSOCKET_CLIENT_CLOSED: Socket closed", {
        connectionId: connection.id,
        code,
        reason: reason.toString()
      });
      webSocketRegistry.unregister(connection.id);
    });

    ws.on("error", (err) => {
      logger.error("WEBSOCKET_CLIENT_ERROR: Socket encountered error", err as Error, {
        connectionId: connection.id
      });
      webSocketRegistry.unregister(connection.id);
    });
  }

  /**
   * Processes validated inbound client JSON messages
   */
  private handleClientMessage(connectionId: string, ws: WebSocket, rawData: unknown): void {
    try {
      const rawString = typeof rawData === "string" ? rawData : rawData?.toString() ?? "";

      // Message Size Check (Section 39)
      if (rawString.length > env.WEBSOCKET_MAX_MESSAGE_SIZE) {
        logger.warn("WEBSOCKET_OVERSIZED_MESSAGE: Client sent payload exceeding maximum limit", {
          connectionId,
          size: rawString.length,
          limit: env.WEBSOCKET_MAX_MESSAGE_SIZE
        });
        return;
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawString);
      } catch {
        logger.warn("WEBSOCKET_MALFORMED_JSON: Discarding non-JSON client message", {
          connectionId,
          snippet: rawString.slice(0, 100)
        });
        return;
      }

      // Validate message structure with Zod (Section 33)
      const parseResult = clientMessageSchema.safeParse(parsedJson);
      if (!parseResult.success) {
        logger.warn("WEBSOCKET_INVALID_SCHEMA: Client message failed schema validation", {
          connectionId,
          issues: parseResult.error.format()
        });
        webSocketBroadcastService.sendToClient(ws, {
          type: "error" as any,
          eventId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          sequence: 0,
          data: {
            code: "INVALID_STATION",
            message: "Inbound message failed schema validation",
            issues: parseResult.error.errors
          }
        });
        return;
      }

      const message = parseResult.data;

      switch (message.type) {
        case CLIENT_MESSAGE_TYPES.STATION_SUBSCRIBE: {
          const subMsg = message as StationSubscribeMessage;
          webSocketRegistry.setSubscriptions(connectionId, subMsg.stations);

          // Section 21: Send initial snapshot for newly subscribed stations
          for (const st of subMsg.stations) {
            if (st !== "ALL") {
              this.sendStationSnapshot(ws, st);
            } else {
              this.sendStationSnapshot(ws, "MAITRI");
              this.sendStationSnapshot(ws, "BHARATI");
            }
          }
          break;
        }

        case CLIENT_MESSAGE_TYPES.STATION_UNSUBSCRIBE: {
          const unsubMsg = message as StationUnsubscribeMessage;
          webSocketRegistry.unsubscribe(connectionId, unsubMsg.stations);
          break;
        }

        case CLIENT_MESSAGE_TYPES.HEARTBEAT_PONG: {
          webSocketRegistry.markAlive(connectionId);
          break;
        }
      }
    } catch (err) {
      logger.error("WEBSOCKET_MESSAGE_PROCESS_ERROR: Unexpected error processing client message", err as Error, {
        connectionId
      });
    }
  }

  /**
   * Sends immediate station snapshot upon subscription (Section 21)
   */
  private sendStationSnapshot(ws: WebSocket, stationCode: StationCode): void {
    const state = simulationEngine.getStationState(stationCode);
    const baseline = STATION_BASELINES[stationCode];

    const data = state
      ? {
          stationCode,
          temperature: state.currentEnvironment.temperature,
          humidity: state.currentEnvironment.humidity,
          pressure: state.currentEnvironment.pressure,
          windSpeed: state.currentEnvironment.windSpeed,
          windDirection: state.currentEnvironment.windDirection,
          visibility: state.currentEnvironment.visibility,
          generationKw: state.currentEnergy.generationKw,
          consumptionKw: state.currentEnergy.consumptionKw,
          batteryPercent: state.currentEnergy.batteryPercent,
          fuelPercent: state.currentEnergy.fuelPercent
        }
      : baseline
      ? {
          stationCode,
          temperature: baseline.temperature,
          humidity: baseline.humidity,
          pressure: baseline.pressure,
          windSpeed: baseline.windSpeed,
          windDirection: baseline.windDirection,
          visibility: baseline.visibility,
          generationKw: baseline.powerGenerationKw,
          consumptionKw: baseline.powerConsumptionKw,
          batteryPercent: baseline.batteryPercent,
          fuelPercent: baseline.fuelPercent
        }
      : null;

    if (!data) return;

    webSocketBroadcastService.sendToClient(ws, {
      type: REALTIME_EVENT_TYPES.STATION_SNAPSHOT,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      stationCode,
      sequence: sequenceManager.getSequence(stationCode),
      data
    });
  }

  /**
   * Subscribes to domain events emitted on the internal EventBus and fans out via WebSockets
   */
  private wireDomainEvents(): void {
    // 1. Telemetry Updates
    const unsubTelemetry = realtimeEventBus.subscribe(
      REALTIME_EVENT_TYPES.TELEMETRY_UPDATE,
      (event: EventEnvelope) => {
        if (event.stationCode) {
          webSocketBroadcastService.broadcastToStation(event.stationCode, event);
        } else {
          webSocketBroadcastService.broadcastToAll(event);
        }
      }
    );
    this.eventBusUnsubscribers.push(unsubTelemetry);

    // 2. Alert Triggered Events & Phase 9 Alert Lifecycle Events
    const alertEventTypes = [
      REALTIME_EVENT_TYPES.ALERT_TRIGGERED,
      REALTIME_EVENT_TYPES.ALERT_CREATED,
      REALTIME_EVENT_TYPES.ALERT_UPDATED,
      REALTIME_EVENT_TYPES.ALERT_ACKNOWLEDGED,
      REALTIME_EVENT_TYPES.ALERT_ESCALATED,
      REALTIME_EVENT_TYPES.ALERT_RESOLVED,
      REALTIME_EVENT_TYPES.ALERT_SUPPRESSED,
      REALTIME_EVENT_TYPES.INCIDENT_CREATED,
      REALTIME_EVENT_TYPES.INCIDENT_UPDATED,
      REALTIME_EVENT_TYPES.INCIDENT_STATUS_CHANGED,
      REALTIME_EVENT_TYPES.INCIDENT_ASSIGNED,
      REALTIME_EVENT_TYPES.INCIDENT_RESOLVED,
      REALTIME_EVENT_TYPES.INCIDENT_CLOSED
    ];

    for (const evtType of alertEventTypes) {
      const unsub = realtimeEventBus.subscribe(evtType, (event: EventEnvelope) => {
        if (event.stationCode) {
          webSocketBroadcastService.broadcastToStation(event.stationCode, event);
        } else {
          webSocketBroadcastService.broadcastToAll(event);
        }
      });
      this.eventBusUnsubscribers.push(unsub);
    }

    // 3. Scenario Active Events
    const unsubScenario = realtimeEventBus.subscribe(
      REALTIME_EVENT_TYPES.SCENARIO_ACTIVE,
      (event: EventEnvelope) => {
        if (event.stationCode) {
          webSocketBroadcastService.broadcastToStation(event.stationCode, event);
        } else {
          webSocketBroadcastService.broadcastToAll(event);
        }
      }
    );
    this.eventBusUnsubscribers.push(unsubScenario);

    // 4. Equipment Updates
    const unsubEquipment = realtimeEventBus.subscribe(
      REALTIME_EVENT_TYPES.EQUIPMENT_UPDATE,
      (event: EventEnvelope) => {
        if (event.stationCode) {
          webSocketBroadcastService.broadcastToStation(event.stationCode, event);
        } else {
          webSocketBroadcastService.broadcastToAll(event);
        }
      }
    );
    this.eventBusUnsubscribers.push(unsubEquipment);

    // 5. Station Operational Status
    const unsubStatus = realtimeEventBus.subscribe(
      REALTIME_EVENT_TYPES.STATION_STATUS,
      (event: EventEnvelope) => {
        if (event.stationCode) {
          webSocketBroadcastService.broadcastToStation(event.stationCode, event);
        } else {
          webSocketBroadcastService.broadcastToAll(event);
        }
      }
    );
    this.eventBusUnsubscribers.push(unsubStatus);

    // 6. System Status
    const unsubSystem = realtimeEventBus.subscribe(
      REALTIME_EVENT_TYPES.SYSTEM_STATUS,
      (event: EventEnvelope) => {
        webSocketBroadcastService.broadcastToAll(event);
      }
    );
    this.eventBusUnsubscribers.push(unsubSystem);
  }

  /**
   * Graceful server shutdown (Section 50)
   */
  public async shutdown(): Promise<void> {
    logger.info("WEBSOCKET_SHUTDOWN: Commencing graceful WebSocket server termination...");

    // Stop heartbeat interval
    webSocketHeartbeatManager.stop();

    // Remove event bus listeners
    for (const unsub of this.eventBusUnsubscribers) {
      unsub();
    }
    this.eventBusUnsubscribers = [];

    // Terminate active client sockets cleanly
    const connections = webSocketRegistry.getAllConnections();
    for (const conn of connections) {
      try {
        conn.socket.close(1001, "Server shutting down");
      } catch {
        conn.socket.terminate();
      }
    }

    webSocketRegistry.clear();

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss?.close(() => {
          logger.info("WEBSOCKET_SERVER_CLOSED: WebSocket server stopped cleanly");
          resolve();
        });
      });
      this.wss = null;
    }

    this.isInitialized = false;
  }
}

export const polarisWebSocketServer = PolarisWebSocketServer.getInstance();
