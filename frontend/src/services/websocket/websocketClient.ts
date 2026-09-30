import { getAccessToken } from "../../lib/apiClient";
import { authService } from "../authService";
import { StationFilter } from "../../types";
import {
  RealtimeConnectionStatus,
  WsConnectionState,
  WsEventEnvelope,
  WsEventType,
  WS_EVENT_TYPES,
  WS_CLIENT_MESSAGES
} from "./websocket.types";

export type WsListener<T = unknown> = (event: WsEventEnvelope<T>) => void;
export type StatusListener = (status: RealtimeConnectionStatus, connectionState?: WsConnectionState) => void;

/**
 * Production-Quality Native Browser WebSocket Client (Sections 18, 19, 20, 28, 49)
 * Features:
 * - Handshake JWT authentication
 * - Bounded exponential backoff with jitter (1s - 30s)
 * - Automatic subscription restoration on reconnect
 * - REST state resynchronization trigger
 * - Isolated event listener dispatch
 * - Heartbeat ping-pong response
 */
export class PolarisWebSocketClient {
  private static instance: PolarisWebSocketClient;
  private socket: WebSocket | null = null;
  private status: RealtimeConnectionStatus = "OFFLINE";
  private connectionState: WsConnectionState = "DISCONNECTED";

  // Reconnection state
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly baseDelayMs = 1000;
  private readonly maxDelayMs = 30000;
  private isManuallyClosed = false;

  // Active subscriptions
  private subscribedStations = new Set<StationFilter>();

  // Event and Status listeners
  private eventListeners = new Map<string, Set<WsListener<any>>>();
  private statusListeners = new Set<StatusListener>();
  private resyncListeners = new Set<() => void>();

  private constructor() {}

  public static getInstance(): PolarisWebSocketClient {
    if (!PolarisWebSocketClient.instance) {
      PolarisWebSocketClient.instance = new PolarisWebSocketClient();
    }
    return PolarisWebSocketClient.instance;
  }

  /**
   * Connects to the POLARIS backend WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isManuallyClosed = false;
    this.setStatus("RECONNECTING");

    let token = getAccessToken();

    // If access token is absent, attempt silent refresh once
    if (!token) {
      try {
        const refreshResult = await authService.refresh();
        token = refreshResult.accessToken;
      } catch {
        this.setStatus("OFFLINE", "ERROR");
        return;
      }
    }

    try {
      this.setConnectionState("CONNECTING");
      const wsUrl = this.getWebSocketUrl(token);
      // Pass subprotocol for browsers that prefer protocol-level token negotiation
      this.socket = new WebSocket(wsUrl, ["polaris-auth", token]);

      this.socket.onopen = () => {
        this.setStatus("LIVE", "CONNECTED");
        this.reconnectAttempts = 0;

        // Section 18: Restore active station subscriptions automatically
        if (this.subscribedStations.size > 0) {
          this.sendSubscribe(Array.from(this.subscribedStations));
        }

        // Section 20: Trigger REST resynchronization on reconnect
        for (const resync of this.resyncListeners) {
          try {
            resync();
          } catch (err) {
            console.error("WsResyncError:", err);
          }
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.socket = null;

        // If closed due to authentication failure (401 or 403)
        if (event.code === 1008 || event.reason.includes("Unauthorized") || event.reason.includes("Forbidden")) {
          this.setStatus("OFFLINE", "ERROR");
          return;
        }

        if (!this.isManuallyClosed) {
          this.scheduleReconnect();
        } else {
          this.setStatus("OFFLINE", "DISCONNECTED");
        }
      };

      this.socket.onerror = () => {
        this.setConnectionState("ERROR");
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnects cleanly (e.g. on logout)
   */
  public disconnect(): void {
    this.isManuallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        this.socket.close(1000, "Client disconnect");
      } catch {
        // Ignore
      }
      this.socket = null;
    }

    this.setStatus("OFFLINE");
  }

  /**
   * Subscribes to station telemetry streams (Section 13 & 15)
   */
  public subscribe(stations: StationFilter[]): void {
    for (const st of stations) {
      this.subscribedStations.add(st);
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendSubscribe(stations);
    }
  }

  /**
   * Unsubscribes from station telemetry streams
   */
  public unsubscribe(stations: StationFilter[]): void {
    for (const st of stations) {
      this.subscribedStations.delete(st);
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const msg = {
        type: WS_CLIENT_MESSAGES.STATION_UNSUBSCRIBE,
        stations
      };
      this.socket.send(JSON.stringify(msg));
    }
  }

  /**
   * Registers a typed event listener. Returns unsubscribe function.
   */
  public on<T = unknown>(eventType: WsEventType | "*", listener: WsListener<T>): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Registers a connection status listener
   */
  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Registers a resync trigger (fired on successful reconnection)
   */
  public onResync(callback: () => void): () => void {
    this.resyncListeners.add(callback);
    return () => {
      this.resyncListeners.delete(callback);
    };
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public getConnectionState(): WsConnectionState {
    return this.connectionState;
  }

  public setConnectionState(newState: WsConnectionState): void {
    this.connectionState = newState;
  }

  private setStatus(newStatus: RealtimeConnectionStatus, newState?: WsConnectionState): void {
    if (newState) {
      this.connectionState = newState;
    }
    this.status = newStatus;
    for (const listener of this.statusListeners) {
      listener(newStatus, this.connectionState);
    }
  }

  /**
   * Schedules reconnection with bounded exponential backoff and jitter (Section 18)
   */
  private scheduleReconnect(): void {
    if (this.isManuallyClosed || this.reconnectTimer) return;

    this.setStatus("RECONNECTING", "RECONNECTING");

    this.reconnectAttempts++;
    // Exponential calculation: min(30000, 1000 * 2^attempts)
    const expDelay = Math.min(
      this.maxDelayMs,
      this.baseDelayMs * Math.pow(2, Math.min(this.reconnectAttempts - 1, 6))
    );
    // Add 10-20% jitter
    const jitter = Math.floor(Math.random() * (expDelay * 0.2));
    const delay = expDelay + jitter;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.connect();
    }, delay);
  }

  /**
   * Safely parses and handles inbound WebSocket JSON frames
   */
  private handleMessage(rawData: string): void {
    try {
      const parsed: WsEventEnvelope = JSON.parse(rawData);

      // Section 16: Handle heartbeat ping frame from server
      if (parsed.type === WS_EVENT_TYPES.HEARTBEAT_PING) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({
              type: WS_CLIENT_MESSAGES.HEARTBEAT_PONG,
              timestamp: new Date().toISOString()
            })
          );
        }
        return;
      }

      // Dispatch to specific event listeners
      const listeners = this.eventListeners.get(parsed.type);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(parsed);
          } catch (err) {
            console.error("WsListenerError:", err);
          }
        }
      }

      // Dispatch to wildcard listeners
      const wildcardListeners = this.eventListeners.get("*");
      if (wildcardListeners) {
        for (const listener of wildcardListeners) {
          try {
            listener(parsed);
          } catch (err) {
            console.error("WsWildcardListenerError:", err);
          }
        }
      }
    } catch {
      // Discard malformed JSON safely without crashing (Section 33 & 34)
    }
  }

  private sendSubscribe(stations: StationFilter[]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const msg = {
      type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE,
      stations
    };
    this.socket.send(JSON.stringify(msg));
  }

  private getWebSocketUrl(token: string): string {
    const customUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_SOCKET_URL;
    if (customUrl) {
      const formattedUrl = customUrl.replace(/^http/, "ws");
      return `${formattedUrl}${formattedUrl.includes("/ws") ? "" : "/ws"}?token=${encodeURIComponent(token)}`;
    }

    // Derive from VITE_API_URL if configured for remote production environments
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.startsWith("http")) {
      const wsFromApi = apiUrl.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
      return `${wsFromApi}/ws?token=${encodeURIComponent(token)}`;
    }

    const isSecure = window.location.protocol === "https:";
    const protocol = isSecure ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = "5000";

    return `${protocol}//${host}:${port}/ws?token=${encodeURIComponent(token)}`;
  }
}

export const polarisWebSocketClient = PolarisWebSocketClient.getInstance();
