import { WebSocket } from "ws";
import { WebSocketRegistry, webSocketRegistry } from "./websocket.registry";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

/**
 * WebSocket Heartbeat & Stale Connection Pruner (Sections 16 & 17)
 * Proactively verifies socket liveness and terminates un responsive zombie connections.
 */
export class WebSocketHeartbeatManager {
  private timerHandle: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private timeoutMs: number;
  private registry: WebSocketRegistry;

  constructor(
    intervalMs = env.WEBSOCKET_HEARTBEAT_INTERVAL_MS,
    timeoutMs = env.WEBSOCKET_CONNECTION_TIMEOUT_MS,
    registry = webSocketRegistry
  ) {
    this.intervalMs = intervalMs;
    this.timeoutMs = timeoutMs;
    this.registry = registry;
  }

  /**
   * Starts periodic heartbeat check loop
   */
  public start(): void {
    if (this.timerHandle) return;

    this.timerHandle = setInterval(() => {
      this.checkHeartbeats();
    }, this.intervalMs);

    // Allow node process to exit cleanly if this is the only active timer
    if (this.timerHandle.unref) {
      this.timerHandle.unref();
    }
  }

  /**
   * Stops heartbeat interval loop
   */
  public stop(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  /**
   * Executes a single heartbeat cycle
   */
  public checkHeartbeats(): void {
    const now = Date.now();
    const connections = this.registry.getAllConnections();

    for (const conn of connections) {
      const elapsed = now - conn.lastHeartbeatAt.getTime();

      // Check if connection has exceeded maximum timeout
      if (!conn.isAlive && elapsed > this.timeoutMs) {
        logger.warn("WEBSOCKET_HEARTBEAT_TIMEOUT: Terminating unresponsive stale connection", {
          connectionId: conn.id,
          userId: conn.user.id,
          elapsedSinceLastPongMs: elapsed,
          timeoutLimitMs: this.timeoutMs
        });

        try {
          conn.socket.terminate();
        } catch {
          // Socket already closed
        }
        this.registry.unregister(conn.id);
        continue;
      }

      // Mark connection as waiting for pong, then ping
      conn.isAlive = false;

      try {
        if (conn.socket.readyState === WebSocket.OPEN) {
          conn.socket.ping();
        }
      } catch (err) {
        logger.error("WEBSOCKET_PING_ERROR: Failed to send ping frame", err as Error, {
          connectionId: conn.id
        });
        conn.socket.terminate();
        this.registry.unregister(conn.id);
      }
    }
  }
}

export const webSocketHeartbeatManager = new WebSocketHeartbeatManager();
