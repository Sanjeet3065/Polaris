import { EventEmitter } from "events";
import { logger } from "../../utils/logger";
import { EventEnvelope, RealtimeEventType } from "./realtime.types";

export type RealtimeEventHandler<T = unknown> = (event: EventEnvelope<T>) => void | Promise<void>;

/**
 * Lightweight in-memory Domain Event Bus (Section 4)
 * Decouples domain services (e.g. SimulatorService) from physical WebSocket transport.
 */
export class RealtimeEventBus {
  private static instance: RealtimeEventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    // Allow up to 100 listeners without node memory leak warnings
    this.emitter.setMaxListeners(100);
  }

  public static getInstance(): RealtimeEventBus {
    if (!RealtimeEventBus.instance) {
      RealtimeEventBus.instance = new RealtimeEventBus();
    }
    return RealtimeEventBus.instance;
  }

  /**
   * Publishes a domain event to all registered internal listeners
   */
  public publish<T = unknown>(event: EventEnvelope<T>): void {
    try {
      this.emitter.emit(event.type, event);
      this.emitter.emit("*", event); // Wildcard handler for metrics / monitoring
    } catch (error) {
      logger.error("EVENT_BUS_ERROR: Failed to emit realtime domain event", error as Error, {
        eventType: event.type,
        eventId: event.eventId
      });
    }
  }

  /**
   * Subscribes a listener to a specific event type.
   * Returns an unsubscribe function for clean resource deallocation.
   */
  public subscribe<T = unknown>(
    eventType: RealtimeEventType | "*",
    handler: RealtimeEventHandler<T>
  ): () => void {
    const wrappedHandler = async (event: EventEnvelope<T>) => {
      try {
        await handler(event);
      } catch (err) {
        logger.error("EVENT_BUS_HANDLER_ERROR: Unhandled error in domain event subscriber", err as Error, {
          eventType,
          eventId: event.eventId
        });
      }
    };

    this.emitter.on(eventType, wrappedHandler);

    return () => {
      this.emitter.off(eventType, wrappedHandler);
    };
  }

  /**
   * Removes all listeners (useful for testing and graceful shutdown)
   */
  public removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export const realtimeEventBus = RealtimeEventBus.getInstance();
