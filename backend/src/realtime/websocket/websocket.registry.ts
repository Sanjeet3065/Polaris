import { WebSocket } from "ws";
import crypto from "crypto";
import { StationCode } from "../../simulator/models/simulator.types";
import { AuthenticatedUserContext, RealtimeMetrics } from "../events/realtime.types";
import { logger } from "../../utils/logger";

export interface WebSocketConnection {
  id: string;
  socket: WebSocket;
  user: AuthenticatedUserContext;
  connectedAt: Date;
  lastHeartbeatAt: Date;
  subscribedStations: Set<StationCode | "ALL">;
  isAlive: boolean;
  clientIp?: string;
}

/**
 * High-performance In-Memory Connection Registry (Section 12)
 * Manages active WebSocket connections, user authentication contexts, and station subscriptions.
 */
export class WebSocketRegistry {
  private static instance: WebSocketRegistry;
  private connections = new Map<string, WebSocketConnection>();
  private socketToId = new Map<WebSocket, string>();

  // Metrics counters
  private messagesSentCounter = 0;
  private messagesFailedCounter = 0;
  private lastBroadcastTime: Date | null = null;
  private startTime = Date.now();

  private constructor() {}

  public static getInstance(): WebSocketRegistry {
    if (!WebSocketRegistry.instance) {
      WebSocketRegistry.instance = new WebSocketRegistry();
    }
    return WebSocketRegistry.instance;
  }

  /**
   * Registers a newly authenticated WebSocket connection
   */
  public register(
    socket: WebSocket,
    user: AuthenticatedUserContext,
    clientIp?: string
  ): WebSocketConnection {
    const id = crypto.randomUUID();
    const connection: WebSocketConnection = {
      id,
      socket,
      user,
      connectedAt: new Date(),
      lastHeartbeatAt: new Date(),
      subscribedStations: new Set<StationCode | "ALL">(),
      isAlive: true,
      clientIp
    };

    this.connections.set(id, connection);
    this.socketToId.set(socket, id);

    logger.info("WEBSOCKET_CONNECTED: New connection registered", {
      connectionId: id,
      userId: user.id,
      role: user.role,
      activeConnections: this.connections.size
    });

    return connection;
  }

  /**
   * Unregisters a connection upon disconnect or termination
   */
  public unregister(idOrSocket: string | WebSocket): WebSocketConnection | undefined {
    let id: string;
    let connection: WebSocketConnection | undefined;

    if (typeof idOrSocket === "string") {
      id = idOrSocket;
      connection = this.connections.get(id);
    } else {
      const foundId = this.socketToId.get(idOrSocket);
      if (!foundId) return undefined;
      id = foundId;
      connection = this.connections.get(id);
    }

    if (connection) {
      this.connections.delete(id);
      this.socketToId.delete(connection.socket);

      logger.info("WEBSOCKET_DISCONNECTED: Connection unregistered", {
        connectionId: id,
        userId: connection.user.id,
        connectedDurationMs: Date.now() - connection.connectedAt.getTime(),
        remainingConnections: this.connections.size
      });
    }

    return connection;
  }

  /**
   * Sets (replaces) station subscriptions for a connection (Section 15: Station Switching)
   */
  public setSubscriptions(connectionId: string, stations: (StationCode | "ALL")[]): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    conn.subscribedStations.clear();
    for (const station of stations) {
      conn.subscribedStations.add(station);
    }

    logger.debug("WEBSOCKET_SUBSCRIBED: Station subscription updated", {
      connectionId,
      stations: Array.from(conn.subscribedStations)
    });
  }

  /**
   * Subscribes a connection to station telemetry streams
   */
  public subscribe(connectionId: string, stations: (StationCode | "ALL")[]): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    for (const station of stations) {
      conn.subscribedStations.add(station);
    }

    logger.debug("WEBSOCKET_SUBSCRIBED: Station subscription updated", {
      connectionId,
      stations: Array.from(conn.subscribedStations)
    });
  }

  /**
   * Unsubscribes a connection from station telemetry streams
   */
  public unsubscribe(connectionId: string, stations: (StationCode | "ALL")[]): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    for (const station of stations) {
      conn.subscribedStations.delete(station);
    }

    logger.debug("WEBSOCKET_UNSUBSCRIBED: Station subscription removed", {
      connectionId,
      remainingStations: Array.from(conn.subscribedStations)
    });
  }

  /**
   * Returns a connection by its ID or socket instance
   */
  public getConnection(idOrSocket: string | WebSocket): WebSocketConnection | undefined {
    if (typeof idOrSocket === "string") {
      return this.connections.get(idOrSocket);
    }
    const id = this.socketToId.get(idOrSocket);
    return id ? this.connections.get(id) : undefined;
  }

  /**
   * Returns all active connections
   */
  public getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Returns active WebSocket instances subscribed to a specific station (or subscribed to ALL)
   */
  public getClientsForStation(stationCode?: StationCode): WebSocket[] {
    const clients: WebSocket[] = [];

    for (const conn of this.connections.values()) {
      if (conn.socket.readyState !== WebSocket.OPEN) continue;

      if (!stationCode) {
        clients.push(conn.socket);
        continue;
      }

      if (conn.subscribedStations.has("ALL") || conn.subscribedStations.has(stationCode)) {
        clients.push(conn.socket);
      }
    }

    return clients;
  }

  /**
   * Records heartbeat activity from pong response
   */
  public markAlive(idOrSocket: string | WebSocket): void {
    const conn = this.getConnection(idOrSocket);
    if (conn) {
      conn.isAlive = true;
      conn.lastHeartbeatAt = new Date();
    }
  }

  /**
   * Increments metrics counters
   */
  public recordMessageSent(count = 1): void {
    this.messagesSentCounter += count;
    this.lastBroadcastTime = new Date();
  }

  public recordMessageFailed(count = 1): void {
    this.messagesFailedCounter += count;
  }

  /**
   * Retrieves operational metrics (Section 36)
   */
  public getMetrics(): RealtimeMetrics {
    let totalSubscriptions = 0;
    for (const conn of this.connections.values()) {
      totalSubscriptions += conn.subscribedStations.size;
    }

    return {
      status: this.messagesFailedCounter > 100 ? "DEGRADED" : "HEALTHY",
      connectedClients: this.connections.size,
      activeSubscriptions: totalSubscriptions,
      messagesSent: this.messagesSentCounter,
      messagesFailed: this.messagesFailedCounter,
      lastBroadcastAt: this.lastBroadcastTime,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  public findByUserId(userId: string): WebSocketConnection[] {
    const list: WebSocketConnection[] = [];
    for (const conn of this.connections.values()) {
      if (conn.user.id === userId) {
        list.push(conn);
      }
    }
    return list;
  }

  public getActiveConnectionsCount(): number {
    return this.connections.size;
  }

  /**
   * Clears all connections (for tests and shutdown)
   */
  public clear(): void {
    this.connections.clear();
    this.socketToId.clear();
    this.messagesSentCounter = 0;
    this.messagesFailedCounter = 0;
    this.lastBroadcastTime = null;
  }
}

export const webSocketRegistry = WebSocketRegistry.getInstance();
export { webSocketRegistry as connectionRegistry };
