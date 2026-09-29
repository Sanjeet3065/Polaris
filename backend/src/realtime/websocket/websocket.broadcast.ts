import { WebSocket } from "ws";
import { StationCode } from "../../simulator/models/simulator.types";
import { EventEnvelope } from "../events/realtime.types";
import { WebSocketRegistry, webSocketRegistry } from "./websocket.registry";
import { logger } from "../../utils/logger";

/**
 * Robust WebSocket Broadcast Service with Client Error Isolation (Sections 3, 12, 34)
 */
export class WebSocketBroadcastService {
  private registry: WebSocketRegistry;

  constructor(registry = webSocketRegistry) {
    this.registry = registry;
  }

  /**
   * Broadcasts an event to all connected authenticated clients
   */
  public broadcastToAll<T>(event: EventEnvelope<T>): number {
    const clients = this.registry.getClientsForStation();
    return this.sendToClients(clients, event);
  }

  /**
   * Broadcasts an event to clients subscribed to a specific station (or subscribed to ALL)
   */
  public broadcastToStation<T>(stationCode: StationCode, event: EventEnvelope<T>): number {
    const clients = this.registry.getClientsForStation(stationCode);
    return this.sendToClients(clients, event);
  }

  /**
   * Sends an event directly to a single socket client
   */
  public sendToClient<T>(socket: WebSocket, event: EventEnvelope<T>): boolean {
    if (socket.readyState !== WebSocket.OPEN) return false;

    try {
      const payload = JSON.stringify(event);
      socket.send(payload);
      this.registry.recordMessageSent(1);
      return true;
    } catch (err) {
      this.registry.recordMessageFailed(1);
      logger.error("WEBSOCKET_SEND_ERROR: Failed to transmit message to client", err as Error);
      try {
        socket.terminate();
      } catch {
        // Ignored
      }
      this.registry.unregister(socket);
      return false;
    }
  }

  /**
   * Safe multi-cast with strict error isolation:
   * A failure or slow buffer on one client never breaks or blocks other clients.
   */
  private sendToClients<T>(clients: WebSocket[], event: EventEnvelope<T>): number {
    if (clients.length === 0) return 0;

    let payload: string;
    try {
      payload = JSON.stringify(event);
    } catch (err) {
      logger.error("WEBSOCKET_SERIALIZE_ERROR: Failed to serialize event envelope", err as Error, {
        eventType: event.type,
        eventId: event.eventId
      });
      return 0;
    }

    let successCount = 0;

    for (const socket of clients) {
      if (socket.readyState !== WebSocket.OPEN) continue;

      try {
        socket.send(payload);
        successCount++;
      } catch (err) {
        this.registry.recordMessageFailed(1);
        logger.error("WEBSOCKET_BROADCAST_CLIENT_ERROR: Client dispatch failed; isolating error", err as Error);
        try {
          socket.terminate();
        } catch {
          // Ignored
        }
        this.registry.unregister(socket);
      }
    }

    if (successCount > 0) {
      this.registry.recordMessageSent(successCount);
    }

    return successCount;
  }
}

export const webSocketBroadcastService = new WebSocketBroadcastService();
