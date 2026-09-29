# POLARIS Real-Time WebSocket Architecture (Phase 5)

> **POLARIS** — Polar Operations & Logistics Automated Remote Intelligence System  
> *“A Digital Twin for Smarter Antarctic Station Management”*  
> **Problem Statement:** SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations (Maitri & Bharati)  
> **Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR)

---

## Phase Boundary & Lifecycle Context

* **PHASE 4 (COMPLETED):** Telemetry generation, mathematical physics simulation, environmental modeling, failure scenario injection, and transactional PostgreSQL persistence via Prisma.
* **PHASE 5 (CURRENT):** Real-time native WebSocket server, connection lifecycle, JWT authentication, station-filtered broadcasting, frontend WebSocket client, reconnection with exponential backoff, REST resynchronization, and real-time dashboard UI telemetry updates.
* **PHASE 6 (NEXT):** 3D Digital Twin visualization canvas (Three.js/WebGL). *(Explicitly NOT implemented in Phase 5)*.

---

## 1. WebSocket Architecture Overview

Phase 5 introduces a lightweight, robust, native WebSocket architecture based on the standard `ws` protocol in Node.js + TypeScript, integrated directly into the Express HTTP server instance (`/ws`).

### Architectural Topology

```
                   ┌──────────────────────────────────────┐
                   │          PHASE 4 SIMULATOR           │
                   │   Maitri Engine  |  Bharati Engine   │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
                        SimulatorService.executeTick()
                                      │
                                      ▼
                        Database Persistence (Prisma)
                           (Authoritative Invariant)
                                      │
                            [On Persistence Success]
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    Telemetry Domain       │
                        │        Event Bus          │
                        │ (realtimeService instance)│
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   WebSocket Broadcast     │
                        │         Service           │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    Connection Registry    │
                        │ (Station Filter Engine)   │
                        └─────────────┬─────────────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             ▼                        ▼                        ▼
      Authenticated            Authenticated            Authenticated
         Client A                 Client B                 Client C
   [Subscribed: MAITRI]     [Subscribed: BHARATI]      [Subscribed: ALL]
             │                        │                        │
             └────────────────────────┼────────────────────────┘
                                      ▼
                             POLARIS Frontend
                                      │
                                      ▼
                        Live Dashboard (React Query)
```

The design enforces strict decoupled boundaries:
1. **Simulation Engine** does not know low-level WebSocket sockets or connection counts. It emits domain events through `RealtimeService`.
2. **Persistence Guarantee**: Telemetry broadcast occurs strictly *after* successful database persistence. If database writes fail, events are not broadcast.
3. **Single Persistent Connection**: The browser maintains one authenticated WebSocket connection and handles station switching via client-sent subscription messages.

---

## 2. Authentication & Authorization

Authentication reuses the existing Phase 3 JWT infrastructure without any new token mechanism.

* **Transport Mechanism**: During the initial HTTP Upgrade handshake (`/ws`), the client passes the JWT access token via:
  1. URL Query Parameter: `ws://localhost:5000/ws?token=<ACCESS_TOKEN>`
  2. Protocol Header: `Sec-WebSocket-Protocol: polaris-auth, <ACCESS_TOKEN>`
* **Validation Pipeline (`websocket.auth.ts`)**:
  - JWT signature and expiration verification using `env.JWT_ACCESS_SECRET`.
  - Token payload type assertion (`type === 'access'`).
  - Database verification of user existence (`prisma.user.findUnique`).
  - Account status check (`isActive === true`).
  - RBAC verification (`ADMIN`, `OPERATOR`, `VIEWER`).
* **Rejection Criteria**:
  - Missing token -> Handshake rejected (`4001: Missing access token`).
  - Invalid / Expired token -> Handshake rejected (`4002: Invalid or expired access token`).
  - Inactive user -> Handshake rejected (`4003: User account inactive`).
  - Maximum connections reached -> Handshake rejected (`4004: Server connection limit reached`).
* **Security Guardrails**:
  - Tokens are never logged in plaintext.
  - Refresh tokens are prohibited over WebSockets.
  - Role information is extracted authoritatively from the verified token and DB, preventing client spoofing.

---

## 3. Connection Lifecycle & State Machine

```
  [CLIENT]                                                 [SERVER]
     │                                                         │
     ├─── HTTP GET /ws?token=xxx (Upgrade: websocket) ────────>│
     │<── HTTP 101 Switching Protocols ────────────────────────┤ (Auth Passed)
     │                                                         │
     │<── system:status (Welcome Envelope, Initial Status) ────┤ (Safe Default)
     │                                                         │
     ├─── station:subscribe { stations: ["MAITRI"] } ─────────>│ (Zod Validated)
     │<── station:snapshot (Latest Maitri Telemetry State) ────┤ (Instant Fill)
     │                                                         │
     │    [Simulator executes tick & persists]                 │
     │<── telemetry:update (Maitri Live Telemetry) ────────────┤ (Periodic Stream)
     │                                                         │
     │<── PING (Heartbeat every 30s) ──────────────────────────┤
     ├─── PONG ───────────────────────────────────────────────>│
     │                                                         │
     ├─── station:subscribe { stations: ["BHARATI"] } ────────>│ (Station Switch)
     │<── station:snapshot (Latest Bharati Telemetry State) ───┤
     │<── telemetry:update (Bharati Live Telemetry) ───────────┤
     │                                                         │
     ├─── Close Frame / Network Loss ──────────────────────────┤
     │                                                         ▼
     │                                               [Registry Cleanup]
```

### Connection States (`WsConnectionState`)
1. `CONNECTING`: Initial socket opening.
2. `CONNECTED`: Authenticated, active, receiving packets.
3. `RECONNECTING`: Connection dropped; exponential backoff active.
4. `DISCONNECTED`: Clean shutdown or logged out.
5. `ERROR`: Protocol or terminal error encountered.

---

## 4. Event Catalog

All events are strictly typed and defined in [`realtime.types.ts`](file:///c:/Users/SANJEET%20CHAUHAN/Desktop/New%20folder%20(3)/backend/src/realtime/events/realtime.types.ts):

| Event Type | Direction | Description | Trigger Frequency |
| :--- | :--- | :--- | :--- |
| `system:status` | Server -> Client | Server status, connection health, version, active station count | On connection & periodic |
| `station:snapshot` | Server -> Client | Authoritative latest state snapshot of a subscribed station | Immediately upon subscription |
| `telemetry:update` | Server -> Client | Live telemetry: environment, energy, station health, equipment summaries | Every simulator tick (1s - 5s) |
| `alert:triggered` | Server -> Client | Critical/Warning threshold violation or state transition | Event-driven (deduplicated) |
| `scenario:active` | Server -> Client | Failure injection state change (blizzard, blackout, etc.) | On scenario start / update / resolve |
| `equipment:update` | Server -> Client | Subsystem equipment status or health degradation | On equipment state transition |
| `station:status` | Server -> Client | Station operational status shift (`OPTIMAL`, `DEGRADED`, etc.) | On station health transition |
| `station:subscribe` | Client -> Server | Request station subscription (`["MAITRI"]`, `["BHARATI"]`, `["ALL"]`) | On client mount or selector change |
| `station:unsubscribe`| Client -> Server | Remove station subscription | On station de-selection |
| `ping` / `pong` | Bidirectional | Connection keepalive and dead client detection | Configured interval (default 30s) |
| `error` | Server -> Client | Error envelope for malformed or unauthorized frames | On client protocol error |

---

## 5. Event Envelope Specification

All broadcast frames comply with a standardized, deterministic envelope:

```json
{
  "type": "telemetry:update",
  "eventId": "d3b07384-d113-4a14-8e10-9114757c9ec9",
  "timestamp": "2026-09-29T10:45:00.000Z",
  "stationId": "11111111-1111-1111-1111-111111111111",
  "stationCode": "MAITRI",
  "sequence": 1042,
  "data": {
    "environment": {
      "temperature": -28.4,
      "humidity": 68.2,
      "pressure": 984.1,
      "windSpeed": 42.6,
      "windDirection": 140.0,
      "visibility": 8500
    },
    "energy": {
      "generation": 142.5,
      "consumption": 98.3,
      "netPower": 44.2,
      "batterySoC": 94.2,
      "batteryVoltage": 402.1,
      "fuelLevel": 88.5
    },
    "station": {
      "stationHealth": 97.4,
      "operationalStatus": "OPTIMAL"
    },
    "equipment": [
      {
        "id": "gen-1",
        "name": "Primary Diesel Generator",
        "type": "GENERATOR",
        "status": "OPERATIONAL",
        "health": 96.5,
        "temperature": 82.1,
        "vibration": 1.2
      }
    ]
  }
}
```

* **Compact DTO**: Internal database relational bloat and credentials are excluded.
* **Deterministic Guarantees**: `eventId` (UUIDv4), ISO-8601 UTC `timestamp`, and station metadata.

---

## 6. Station Subscriptions & Dynamic Switching

- **Supported Targets**: `MAITRI`, `BHARATI`, or `ALL`.
- **Validation**: Incoming messages are validated using Zod (`IncomingWsMessageSchema`).
- **Safe Default**: Upon initial handshake, the client is NOT automatically subscribed to all stations. It receives a `system:status` frame and awaits explicit client subscription.
- **Atomic Switching**: When a user switches stations in the UI (e.g., Maitri -> Bharati), `webSocketRegistry.setSubscriptions()` atomically replaces the client's subscription list. The client immediately receives a `station:snapshot` for Bharati and begins receiving Bharati updates, completely suppressing Maitri telemetry. No second WebSocket connection is created.

---

## 7. Heartbeat & Dead Connection Reaper

- **Interval (`WEBSOCKET_HEARTBEAT_INTERVAL_MS`)**: 30,000 ms.
- **Timeout (`WEBSOCKET_CONNECTION_TIMEOUT_MS`)**: 60,000 ms.
- **Protocol**:
  1. The server pings every client every 30 seconds and sets `isAlive = false`.
  2. The client responds with native `pong` or `{ "type": "pong" }`, updating `lastHeartbeat` and setting `isAlive = true`.
  3. If a client fails to respond within 60 seconds (`now - lastHeartbeat > timeout`), the server terminates the socket (`ws.terminate()`), removes the client from `ConnectionRegistry`, and logs `WEBSOCKET_HEARTBEAT_TIMEOUT`.

---

## 8. Client Reconnection Strategy

The frontend [`websocketClient.ts`](file:///c:/Users/SANJEET%20CHAUHAN/Desktop/New%20folder%20(3)/frontend/src/services/websocket/websocketClient.ts) implements resilient reconnection:

- **Bounded Exponential Backoff**:
  $$\text{Delay} = \min(\text{baseDelay} \times 2^{\text{attempt}}, \text{maxDelay}) + \text{jitter}$$
  - `baseDelay`: 1,000 ms (1s)
  - `maxDelay`: 30,000 ms (30s)
  - `jitter`: Uniform random offset between $0$ and $1,000$ ms to prevent thundering herd on server restart.
- **Max Retries**: 10 attempts before entering permanent `DISCONNECTED` state requiring manual user action or page re-navigation.
- **Automatic Resubscription**: Upon successful reconnection, the client automatically re-authenticates and re-sends its cached active station subscriptions (`station:subscribe`).

---

## 9. Sequence Numbers & Gap Detection

- **Monotonic Counters**: Server maintains per-station sequence counters (`sequenceMap`).
- **Gap Detection**: If the client observes a sequence increment greater than 1 ($S_{n} - S_{n-1} > 1$), a frame drop is detected.
- **Single-Instance Note**: Sequence numbers are kept in server memory. Multi-instance horizontal scaling would require distributed sequencing (e.g., Redis Streams / Kafka offset).

---

## 10. REST Resynchronization

WebSocket is an ephemeral transport and does not guarantee historical delivery.
- **Resynchronization Trigger**: On reconnect, or when sequence gaps are detected, the frontend triggers an immediate REST re-fetch:
  - `stationService.getTelemetryHistory(stationCode)`
  - `stationService.getStationByCode(stationCode)`
- **Authoritative Baseline**: REST provides the authoritative snapshot; WebSocket streams live incremental deltas.

---

## 11. Simulator Integration

Phase 5 attaches directly to `SimulatorService.executeTick()`:
1. `executeTick()` runs `simulationEngine.tick()`.
2. Telemetry payload is validated.
3. Telemetry is persisted via `telemetryPersistenceService.persistCycle()`.
4. **On Persistence Success**: `realtimeService.publishTelemetry(telemetryData)` is invoked.
5. `RealtimeService` delegates to `WebSocketBroadcastService.broadcastToStation(stationCode, envelope)`.
6. If database persistence throws an error, real-time publishing is skipped to prevent broadcasting uncommitted phantom data.

---

## 12. Frontend Integration & State Management

- **Centralized Service**: [`websocketClient.ts`](file:///c:/Users/SANJEET%20CHAUHAN/Desktop/New%20folder%20(3)/frontend/src/services/websocket/websocketClient.ts) manages the singleton native WebSocket instance.
- **Context Bridge**: [`StationContext.tsx`](file:///c:/Users/SANJEET%20CHAUHAN/Desktop/New%20folder%20(3)/frontend/src/context/StationContext.tsx) acts as the bridge:
  - Registers listeners for `telemetry:update`, `alert:triggered`, `scenario:active`, and `equipment:update`.
  - Seamlessly updates `selectedStation`, environment readings, and energy metrics.
  - Updates TanStack Query caches via `queryClient.setQueryData`.
- **Rolling Chart Window**: Historical charts maintain a strict rolling window of 60 points (`MAX_CHART_POINTS = 60`). When new telemetry arrives, the oldest points are discarded, preventing memory bloat.
- **Stale Telemetry Detection**: If no telemetry packet arrives within 30 seconds (`STALE_THRESHOLD_MS = 30000`), the station is marked `isStale: true`.

---

## 13. Security & Validation

- **No Unauthorized Connections**: Missing or invalid tokens are terminated during handshake.
- **Frame Size Cap**: WebSocket messages are capped at 64 KB (`WEBSOCKET_MAX_MESSAGE_SIZE = 65536`). Oversized frames are rejected.
- **Zod Schema Parsing**: All incoming client payloads are validated at runtime. Invalid schemas produce typed error envelopes without crashing the server.
- **Error Isolation**: If one client's socket throws an error during broadcast, it is caught and cleaned up without affecting other connected clients.
- **Secret Sanitization**: No JWT tokens, passwords, or connection strings are ever written to stdout or logger files.

---

## 14. Performance & Throttling

- **Single Connection per Tab**: One connection handles multi-station switching and multiplexing.
- **Client-Side Throttling**: Chart points and state dispatches are bound to simulator tick intervals (1s - 5s).
- **In-Memory Registry**: Client lookups and station room sets use `Map` and `Set` operations ($O(1)$ complexity).
- **Clean Event Cleanup**: Components unregister event handlers upon unmount to eliminate memory leaks.

---

## 15. Configuration & Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `WEBSOCKET_ENABLED` | `true` | Master toggle for real-time WebSocket subsystem |
| `WEBSOCKET_HEARTBEAT_INTERVAL_MS` | `30000` (30s) | Interval between ping frames sent to clients |
| `WEBSOCKET_CONNECTION_TIMEOUT_MS` | `60000` (60s) | Threshold to reap non-responsive clients |
| `WEBSOCKET_MAX_CONNECTIONS` | `100` | Hard cap on simultaneous client connections per node |
| `WEBSOCKET_MAX_MESSAGE_SIZE` | `65536` (64KB) | Maximum payload size permitted for incoming messages |

---

## 16. Operational Metrics & Status Endpoint

The backend exposes real-time operational telemetry via:
`GET /api/v1/system/realtime` (Protected by Phase 3 RBAC).

```json
{
  "success": true,
  "data": {
    "connectedClients": 4,
    "activeSubscriptions": 5,
    "messagesSent": 2840,
    "messagesFailed": 0,
    "lastBroadcastAt": "2026-09-29T10:45:01.210Z",
    "uptimeSeconds": 1420
  }
}
```

---

## 17. Troubleshooting & Common Scenarios

1. **Client Disconnecting with Code 4001/4002**:
   - Access token has expired or is missing from URL query parameter / protocol header.
   - Trigger the Phase 3 `/api/v1/auth/refresh` flow and reconnect with the new token.
2. **Telemetry Not Updating on Dashboard**:
   - Verify simulator is running (`POST /api/v1/simulator/start` or `POST /api/v1/simulator/tick`).
   - Check connection status pill in top header: `LIVE` indicates active connection.
   - Verify active subscription: Ensure `station:subscribe` was sent for the active station.
3. **Heartbeat Timeouts in Unstable Antarctic Satellite Links**:
   - Increase `WEBSOCKET_CONNECTION_TIMEOUT_MS` to `120000` (120s) if high-latency satellite connections drop pongs.

---

## 18. Future Scaling Considerations (Post-Phase 5)

While Phase 5 is single-instance and in-memory, horizontal scaling across multiple container instances will require:
- **Redis Pub/Sub or Kafka**: Distributed message broker between backend worker nodes.
- **Distributed Sequence IDs**: Global sequence generator (e.g., Redis Streams) across instances.
- **Sticky Sessions / WebSocket Ingress Gateway**: Load balancer configured with session affinity for WebSocket upgrades.
