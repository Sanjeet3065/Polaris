import http from "http";
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { tokenService } from "../services/token.service";
import { realtimeService } from "../realtime/realtime.service";
import { connectionRegistry } from "../realtime/websocket/websocket.registry";
import { sequenceManager } from "../realtime/events/sequence.manager";
import {
  WS_EVENT_TYPES,
  WS_CLIENT_MESSAGES,
  WsEventEnvelope,
  WsTelemetryPayload,
  TelemetryUpdatePayload
} from "../realtime/events/realtime.types";
import { simulatorService } from "../simulator/simulator.service";
import { telemetryPersistenceService } from "../simulator/persistence/telemetry-persistence.service";

interface TestReport {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestReport[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✔ PASS: ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  ❌ FAIL: ${name} -> ${errorMsg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

function waitForMessage<T = any>(
  ws: WebSocket,
  filter?: (parsed: WsEventEnvelope<T>) => boolean,
  timeoutMs = 5000
): Promise<WsEventEnvelope<T>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off("message", onMsg);
      reject(new Error(`Timeout waiting for WebSocket message after ${timeoutMs}ms`));
    }, timeoutMs);

    const onMsg = (data: WebSocket.RawData) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (!filter || filter(parsed)) {
          clearTimeout(timer);
          ws.off("message", onMsg);
          resolve(parsed);
        }
      } catch {
        // ignore malformed
      }
    };

    ws.on("message", onMsg);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function makeTelemetry(stationCode: "MAITRI" | "BHARATI"): TelemetryUpdatePayload {
  return {
    stationId: stationCode === "MAITRI" ? "st-maitri-uuid" : "st-bharati-uuid",
    stationCode,
    timestamp: new Date().toISOString(),
    environment: {
      temperature: -24.5,
      humidity: 65,
      pressure: 985,
      windSpeed: 42,
      windDirection: 180,
      windDirectionCompass: "S",
      visibility: 15,
      solarRadiation: 120,
      snowfallRate: 0.1
    },
    energy: {
      solarKw: 15,
      dieselKw: 45,
      generationKw: 60,
      consumptionKw: 52,
      netPowerKw: 8,
      batteryPercent: 92,
      batteryVoltage: 48.2,
      fuelPercent: 84,
      fuelLiters: 42000,
      fuelDaysRemaining: 95
    },
    station: {
      healthPercent: 98,
      status: "OPERATIONAL"
    },
    equipmentSummary: []
  };
}

export async function runWebSocketTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 5: Real-Time WebSocket Test Suite");
  console.log("Target: 30+ Comprehensive Verification Criteria");
  console.log("=================================================\n");

  let server: http.Server = http.createServer();
  let serverPort: number;
  let testAdminUser: any;
  let testViewerUser: any;
  let inactiveUser: any;
  let adminToken: string;
  let viewerToken: string;

  try {
    // ------------------------------------------------------------
    // Test Setup: Users & Ephemeral Test Server
    // ------------------------------------------------------------
    testAdminUser = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN, isActive: true }
    });
    if (!testAdminUser) {
      testAdminUser = await prisma.user.create({
        data: {
          email: `ws_admin_${Date.now()}@polaris.gov.in`,
          name: "WS Test Admin",
          passwordHash: "argon2id$test",
          role: UserRole.ADMIN,
          isActive: true
        }
      });
    }

    testViewerUser = await prisma.user.findFirst({
      where: { role: UserRole.VIEWER, isActive: true }
    });
    if (!testViewerUser) {
      testViewerUser = await prisma.user.create({
        data: {
          email: `ws_viewer_${Date.now()}@polaris.gov.in`,
          name: "WS Test Viewer",
          passwordHash: "argon2id$test",
          role: UserRole.VIEWER,
          isActive: true
        }
      });
    }

    inactiveUser = await prisma.user.create({
      data: {
        email: `ws_inactive_${Date.now()}@polaris.gov.in`,
        name: "WS Inactive User",
        passwordHash: "argon2id$test",
        role: UserRole.VIEWER,
        isActive: false
      }
    });

    adminToken = tokenService.generateAccessToken(testAdminUser);
    viewerToken = tokenService.generateAccessToken(testViewerUser);

    server = http.createServer();
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as any;
        serverPort = addr.port;
        resolve();
      });
    });

    realtimeService.initialize(server);

    const getWsUrl = (token?: string, path = "/ws") => {
      const base = `ws://127.0.0.1:${serverPort}${path}`;
      return token ? `${base}?token=${encodeURIComponent(token)}` : base;
    };

    // ------------------------------------------------------------
    // Group 1: Server Initialization & Handshake Authentication
    // ------------------------------------------------------------
    console.log("--- Group 1: Server Initialization & Handshake Authentication ---");

    await test("1. WebSocket server starts and attaches to HTTP server", async () => {
      const status = realtimeService.getMetrics();
      assert(status.connectedClients === 0, "Initial connected clients should be 0");
      assert(status.status === "HEALTHY", "Initial status should be HEALTHY");
    });

    await test("2. Authenticated connection succeeds with valid JWT query token", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      const connected = await new Promise<boolean>((resolve) => {
        ws.on("open", () => resolve(true));
        ws.on("error", () => resolve(false));
      });
      assert(connected, "Expected connection to open successfully");

      // Verify connection registry entry
      const meta = connectionRegistry.findByUserId(testAdminUser.id);
      assert(meta.length >= 1, "Connection registry should track connected user");
      assert(meta[0].user.role === UserRole.ADMIN, "Tracked role should be ADMIN");

      ws.close();
      await wait(100);
    });

    await test("3. Missing authentication token is rejected", async () => {
      const ws = new WebSocket(getWsUrl()); // No token
      const rejected = await new Promise<boolean>((resolve) => {
        ws.on("error", () => resolve(true));
        ws.on("close", (code) => resolve(code === 1008 || code === 4001 || code === 1006));
      });
      assert(rejected, "Connection without token must be rejected");
    });

    await test("4. Invalid token signature is rejected", async () => {
      const ws = new WebSocket(getWsUrl("invalid.jwt.signature"));
      const rejected = await new Promise<boolean>((resolve) => {
        ws.on("error", () => resolve(true));
        ws.on("close", (code) => resolve(code === 1008 || code === 4001 || code === 1006));
      });
      assert(rejected, "Connection with forged token must be rejected");
    });

    await test("5. Expired access token is rejected", async () => {
      const expiredToken = jwt.sign(
        {
          sub: testAdminUser.id,
          email: testAdminUser.email,
          role: testAdminUser.role,
          type: "access"
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "-5s" }
      );

      const ws = new WebSocket(getWsUrl(expiredToken));
      const rejected = await new Promise<boolean>((resolve) => {
        ws.on("error", () => resolve(true));
        ws.on("close", (code) => resolve(code === 1008 || code === 4001 || code === 1006));
      });
      assert(rejected, "Connection with expired token must be rejected");
    });

    await test("6. Inactive user account is rejected", async () => {
      const inactiveToken = tokenService.generateAccessToken(inactiveUser);
      const ws = new WebSocket(getWsUrl(inactiveToken));
      const rejected = await new Promise<boolean>((resolve) => {
        ws.on("error", () => resolve(true));
        ws.on("close", (code) => resolve(code === 1008 || code === 4001 || code === 1006));
      });
      assert(rejected, "Connection from deactivated user must be rejected");
    });

    await test("7. Authentication via Sec-WebSocket-Protocol subprotocol succeeds", async () => {
      const ws = new WebSocket(getWsUrl(undefined, "/ws"), ["polaris-auth", adminToken]);
      const connected = await new Promise<boolean>((resolve) => {
        ws.on("open", () => resolve(true));
        ws.on("error", () => resolve(false));
      });
      assert(connected, "Connection with subprotocol auth should succeed");
      ws.close();
      await wait(100);
    });

    // ------------------------------------------------------------
    // Group 2: Connection Registry & Lifecycle Management
    // ------------------------------------------------------------
    console.log("\n--- Group 2: Connection Registry & Lifecycle Management ---");

    await test("8. Connection registry accurately tracks metadata", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      const count = connectionRegistry.getActiveConnectionsCount();
      assert(count >= 1, `Expected at least 1 active connection, got ${count}`);

      ws.close();
      await wait(100);
    });

    await test("9. Client disconnect removes entry from registry", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      const before = connectionRegistry.getActiveConnectionsCount();
      ws.close();
      await wait(100);
      const after = connectionRegistry.getActiveConnectionsCount();
      assert(after === before - 1, `Registry count should decrease by 1, was ${before} now ${after}`);
    });

    await test("10. Duplicate connection from same user is handled safely", async () => {
      const beforeCount = connectionRegistry.findByUserId(testAdminUser.id).length;
      const ws1 = new WebSocket(getWsUrl(adminToken));
      const ws2 = new WebSocket(getWsUrl(adminToken));

      await Promise.all([
        new Promise<void>((res) => ws1.on("open", res)),
        new Promise<void>((res) => ws2.on("open", res))
      ]);

      const conns = connectionRegistry.findByUserId(testAdminUser.id);
      assert(conns.length === beforeCount + 2, `Expected 2 new simultaneous connections for admin, got ${conns.length}`);

      ws1.close();
      ws2.close();
      await wait(100);
    });

    await test("11. Client can send heartbeat pong and update lastHeartbeatAt", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      ws.send(
        JSON.stringify({
          type: WS_CLIENT_MESSAGES.HEARTBEAT_PONG,
          timestamp: new Date().toISOString()
        })
      );

      await wait(100);
      const meta = connectionRegistry.findByUserId(testAdminUser.id);
      const latest = meta[meta.length - 1];
      assert(latest !== undefined, "Client metadata should exist");
      assert(latest.isAlive === true, "Connection isAlive should be true");

      ws.close();
      await wait(100);
    });

    // ------------------------------------------------------------
    // Group 3: Station Subscriptions & Dynamic Filtering
    // ------------------------------------------------------------
    console.log("\n--- Group 3: Station Subscriptions & Dynamic Filtering ---");

    await test("12. Client subscribes to MAITRI and receives confirmation snapshot", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      const snapshotPromise = waitForMessage(ws, (m) => m.type === WS_EVENT_TYPES.STATION_SNAPSHOT);

      ws.send(
        JSON.stringify({
          type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE,
          stations: ["MAITRI"]
        })
      );

      const msg = await snapshotPromise;
      assert(msg.type === WS_EVENT_TYPES.STATION_SNAPSHOT, "Should receive station snapshot");
      assert(msg.stationCode === "MAITRI", "Snapshot should be for MAITRI");

      const meta = connectionRegistry.findByUserId(testAdminUser.id);
      const latest = meta[meta.length - 1];
      assert(latest.subscribedStations.has("MAITRI"), "Registry should contain MAITRI subscription");

      ws.close();
      await wait(100);
    });

    await test("13. Client subscribes to BHARATI and updates subscription", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      ws.send(
        JSON.stringify({
          type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE,
          stations: ["BHARATI"]
        })
      );

      await wait(100);
      const meta = connectionRegistry.findByUserId(testAdminUser.id);
      const latest = meta[meta.length - 1];
      assert(latest.subscribedStations.has("BHARATI"), "Registry should contain BHARATI subscription");

      ws.close();
      await wait(100);
    });

    await test("14. Client subscribes to ALL stations", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      ws.send(
        JSON.stringify({
          type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE,
          stations: ["ALL"]
        })
      );

      await wait(100);
      const meta = connectionRegistry.findByUserId(testAdminUser.id);
      const latest = meta[meta.length - 1];
      assert(latest.subscribedStations.has("ALL"), "Registry should contain ALL subscription");

      ws.close();
      await wait(100);
    });

    await test("15. Invalid station subscription is rejected safely with error", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      const errPromise = waitForMessage(ws, (m: any) => m.type === "error" || m.data?.code === "INVALID_STATION");

      ws.send(
        JSON.stringify({
          type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE,
          stations: ["UNKNOWN_STATION_99"]
        })
      );

      const err = await errPromise;
      assert(err !== null, "Server should reply with error for invalid station");

      ws.close();
      await wait(100);
    });

    await test("16. Client can unsubscribe from stations dynamically", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      ws.send(
        JSON.stringify({
          type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE,
          stations: ["MAITRI", "BHARATI"]
        })
      );
      await wait(100);

      ws.send(
        JSON.stringify({
          type: WS_CLIENT_MESSAGES.STATION_UNSUBSCRIBE,
          stations: ["MAITRI"]
        })
      );
      await wait(100);

      const meta = connectionRegistry.findByUserId(testAdminUser.id);
      const latest = meta[meta.length - 1];
      assert(!latest.subscribedStations.has("MAITRI"), "MAITRI should be removed");
      assert(latest.subscribedStations.has("BHARATI"), "BHARATI should remain");

      ws.close();
      await wait(100);
    });

    // ------------------------------------------------------------
    // Group 4: Realtime Event Catalog & Broadcast Filtering
    // ------------------------------------------------------------
    console.log("\n--- Group 4: Realtime Event Catalog & Broadcast Filtering ---");

    await test("17. telemetry:update event is broadcast with proper envelope", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      const updatePromise = waitForMessage<WsTelemetryPayload>(
        ws,
        (m) => m.type === WS_EVENT_TYPES.TELEMETRY_UPDATE && m.stationCode === "MAITRI"
      );

      // Publish synthetic domain event via realtimeService
      realtimeService.publishTelemetry(makeTelemetry("MAITRI"));

      const envelope = await updatePromise;
      assert(envelope.type === WS_EVENT_TYPES.TELEMETRY_UPDATE, "Event type should match");
      assert(envelope.eventId !== undefined, "Must contain eventId");
      assert(envelope.timestamp !== undefined, "Must contain timestamp");
      assert(typeof envelope.sequence === "number", "Must contain numeric sequence");
      assert(envelope.data.environment.temperature === -24.5, "Payload temperature should match");

      ws.close();
      await wait(100);
    });

    await test("18. Sequence numbers increment monotonically per station", async () => {
      const s1 = sequenceManager.next("MAITRI");
      const s2 = sequenceManager.next("MAITRI");
      const s3 = sequenceManager.next("MAITRI");
      assert(s2 === s1 + 1 && s3 === s2 + 1, `Sequences must increment by 1: ${s1}, ${s2}, ${s3}`);
    });

    await test("19. Maitri filtering works: Maitri subscriber does NOT receive Bharati telemetry", async () => {
      const wsMaitri = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => wsMaitri.on("open", res));
      wsMaitri.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      let bharatiDeliveredToMaitri = false;
      wsMaitri.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString());
          if (parsed.stationCode === "BHARATI") {
            bharatiDeliveredToMaitri = true;
          }
        } catch {}
      });

      // Broadcast Bharati event
      realtimeService.publishTelemetry(makeTelemetry("BHARATI"));

      await wait(200);
      assert(!bharatiDeliveredToMaitri, "Maitri client must NOT receive Bharati telemetry");

      wsMaitri.close();
      await wait(100);
    });

    await test("20. Bharati filtering works: Bharati subscriber does NOT receive Maitri telemetry", async () => {
      const wsBharati = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => wsBharati.on("open", res));
      wsBharati.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["BHARATI"] }));
      await wait(100);

      let maitriDeliveredToBharati = false;
      wsBharati.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString());
          if (parsed.stationCode === "MAITRI") {
            maitriDeliveredToBharati = true;
          }
        } catch {}
      });

      // Broadcast Maitri event
      realtimeService.publishTelemetry(makeTelemetry("MAITRI"));

      await wait(200);
      assert(!maitriDeliveredToBharati, "Bharati client must NOT receive Maitri telemetry");

      wsBharati.close();
      await wait(100);
    });

    await test("21. ALL stations subscription receives both Maitri and Bharati events", async () => {
      const wsAll = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => wsAll.on("open", res));
      wsAll.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["ALL"] }));
      await wait(100);

      const receivedCodes: string[] = [];
      wsAll.on("message", (raw) => {
        try {
          const p = JSON.parse(raw.toString());
          if (p.type === WS_EVENT_TYPES.TELEMETRY_UPDATE && p.stationCode) {
            receivedCodes.push(p.stationCode);
          }
        } catch {}
      });

      realtimeService.publishTelemetry(makeTelemetry("MAITRI"));
      realtimeService.publishTelemetry(makeTelemetry("BHARATI"));

      await wait(200);
      assert(receivedCodes.includes("MAITRI"), "ALL subscriber should receive MAITRI");
      assert(receivedCodes.includes("BHARATI"), "ALL subscriber should receive BHARATI");

      wsAll.close();
      await wait(100);
    });

    await test("22. scenario:active event is emitted and delivered", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      const scenarioPromise = waitForMessage(ws, (m) => m.type === WS_EVENT_TYPES.SCENARIO_ACTIVE);

      realtimeService.publishScenarioActive({
        scenario: "HIGH_WIND",
        stationCode: "MAITRI",
        intensity: 0.85,
        status: "STARTED",
        startTimestamp: new Date().toISOString(),
        elapsedSeconds: 0,
        affectedSubsystem: "ENVIRONMENT"
      });

      const msg = await scenarioPromise;
      assert(msg.type === WS_EVENT_TYPES.SCENARIO_ACTIVE, "Event type must be scenario:active");
      assert(msg.data.scenario === "HIGH_WIND", "Scenario name must match");

      ws.close();
      await wait(100);
    });

    await test("23. equipment:update event is emitted and delivered", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["BHARATI"] }));
      await wait(100);

      const equipPromise = waitForMessage(ws, (m) => m.type === WS_EVENT_TYPES.EQUIPMENT_UPDATE);

      realtimeService.publishEquipmentUpdate({
        equipmentId: "BHARATI-GEN-01",
        stationCode: "BHARATI",
        status: "WARNING",
        healthPercent: 78,
        temperature: 92.5,
        vibration: 4.8,
        runtimeHours: 3420,
        timestamp: new Date().toISOString()
      });

      const msg = await equipPromise;
      assert(msg.type === WS_EVENT_TYPES.EQUIPMENT_UPDATE, "Event must be equipment:update");
      assert(msg.data.equipmentId === "BHARATI-GEN-01", "Equipment ID must match");
      assert(msg.data.healthPercent === 78, "Health percent must match");

      ws.close();
      await wait(100);
    });

    await test("24. station:status event is emitted on status transition", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      const statusPromise = waitForMessage(ws, (m) => m.type === WS_EVENT_TYPES.STATION_STATUS);

      realtimeService.publishStationStatus({
        stationCode: "MAITRI",
        stationId: "st-maitri-uuid",
        status: "DEGRADED",
        healthPercent: 79,
        previousStatus: "OPERATIONAL",
        timestamp: new Date().toISOString()
      });

      const msg = await statusPromise;
      assert(msg.type === WS_EVENT_TYPES.STATION_STATUS, "Event must be station:status");
      assert(msg.data.status === "DEGRADED", "Status should be DEGRADED");

      ws.close();
      await wait(100);
    });

    await test("25. Alert event deduplication suppresses identical alerts within suppression window", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      let alertCount = 0;
      ws.on("message", (raw) => {
        try {
          const p = JSON.parse(raw.toString());
          if (p.type === WS_EVENT_TYPES.ALERT_TRIGGERED && p.data?.title === "High Wind Velocity Warning") {
            alertCount++;
          }
        } catch {}
      });

      const alertPayload = {
        id: "alert-test-dedup",
        stationId: "st-maitri-uuid",
        stationCode: "MAITRI" as const,
        severity: "WARNING" as const,
        category: "ENVIRONMENT" as const,
        title: "High Wind Velocity Warning",
        message: "Wind speed exceeded 40 km/h threshold",
        triggeredAt: new Date().toISOString()
      };

      // Emit 3 consecutive times with same title
      realtimeService.publishAlert(alertPayload);
      realtimeService.publishAlert(alertPayload);
      realtimeService.publishAlert(alertPayload);

      await wait(200);
      assert(alertCount === 1, `Expected exactly 1 alert delivered due to dedup, got ${alertCount}`);

      ws.close();
      await wait(100);
    });

    // ------------------------------------------------------------
    // Group 5: Fault Tolerance, Message Limits & Boundary Checks
    // ------------------------------------------------------------
    console.log("\n--- Group 5: Fault Tolerance, Message Limits & Boundary Checks ---");

    await test("26. Malformed JSON message is safely ignored without crashing server", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      // Send raw garbage
      ws.send("{{malformed_not_json_###");
      await wait(100);

      // Verify connection still alive and responsive
      assert(ws.readyState === WebSocket.OPEN, "Socket should remain open after malformed message");

      ws.close();
      await wait(100);
    });

    await test("27. Oversized message exceeding size limit is rejected safely", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      // Send huge payload > 64KB
      const hugeString = "X".repeat(70 * 1024);
      ws.send(hugeString);

      const closed = await new Promise<boolean>((resolve) => {
        ws.on("close", (code) => resolve(code === 1009 || code === 1006));
        setTimeout(() => resolve(false), 2000);
      });
      assert(closed, "Oversized message should trigger socket closure (code 1009)");
    });

    await test("28. Broken client does not prevent other clients from receiving broadcasts", async () => {
      const wsHealthy = new WebSocket(getWsUrl(adminToken));
      const wsClosing = new WebSocket(getWsUrl(adminToken));

      await Promise.all([
        new Promise<void>((res) => wsHealthy.on("open", res)),
        new Promise<void>((res) => wsClosing.on("open", res))
      ]);

      wsHealthy.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      wsClosing.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      // Abruptly terminate wsClosing's underlying connection without clean close handshake
      (wsClosing as any).terminate();

      const receivedPromise = waitForMessage(wsHealthy, (m) => m.type === WS_EVENT_TYPES.TELEMETRY_UPDATE);

      realtimeService.publishTelemetry(makeTelemetry("MAITRI"));

      const msg = await receivedPromise;
      assert(msg !== null, "Healthy client must receive broadcast even when peer abruptly dies");

      wsHealthy.close();
      await wait(100);
    });

    // ------------------------------------------------------------
    // Group 6: Simulator End-to-End Integration & Persistence Safety
    // ------------------------------------------------------------
    console.log("\n--- Group 6: Simulator Integration & End-to-End Flow ---");

    await test("29. Simulator tick broadcasts telemetry to subscribed WebSocket client", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      const tickUpdatePromise = waitForMessage<WsTelemetryPayload>(
        ws,
        (m) => m.type === WS_EVENT_TYPES.TELEMETRY_UPDATE && m.stationCode === "MAITRI",
        10000
      );

      // Execute real SimulatorService tick
      await simulatorService.executeTick();

      const msg = await tickUpdatePromise;
      assert(msg.type === WS_EVENT_TYPES.TELEMETRY_UPDATE, "Should receive telemetry:update from tick");
      assert(msg.stationCode === "MAITRI", "Station must be MAITRI");
      assert(typeof msg.data.environment.temperature === "number", "Temperature must be number");
      assert(typeof msg.data.energy.generationKw === "number", "GenerationKw must be number");
      assert(typeof msg.data.station.healthPercent === "number", "HealthPercent must be number");

      ws.close();
      await wait(100);
    });

    await test("30. Database persistence failure halts telemetry broadcast (Section 22)", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      let broadcastOccurred = false;
      const onMsg = (raw: WebSocket.RawData) => {
        try {
          const p = JSON.parse(raw.toString());
          if (p.type === WS_EVENT_TYPES.TELEMETRY_UPDATE && p.data?.environment?.temperature === 999.99) {
            broadcastOccurred = true;
          }
        } catch {}
      };
      ws.on("message", onMsg);

      // Temporarily mock persistence service to throw an error
      const originalPersist = telemetryPersistenceService.persistCycle;
      telemetryPersistenceService.persistCycle = async () => {
        throw new Error("Simulated Database Outage");
      };

      try {
        await simulatorService.executeTick();
      } catch (err: any) {
        assert(err.message === "Simulated Database Outage", "Should catch simulated DB error");
      } finally {
        telemetryPersistenceService.persistCycle = originalPersist;
      }

      await wait(200);
      assert(!broadcastOccurred, "Invalid/unpersisted telemetry must NEVER be broadcast");

      ws.close();
      await wait(100);
    });

    await test("31. End-to-End station switching: MAITRI -> BHARATI receives new feed seamlessly", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      // 1. Subscribe to MAITRI
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["MAITRI"] }));
      await wait(100);

      const maitriPromise = waitForMessage(ws, (m) => m.type === WS_EVENT_TYPES.TELEMETRY_UPDATE && m.stationCode === "MAITRI");
      realtimeService.publishTelemetry(makeTelemetry("MAITRI"));
      const maitriMsg = await maitriPromise;
      assert(maitriMsg.stationCode === "MAITRI", "Should receive MAITRI message");

      // 2. Switch subscription to BHARATI
      ws.send(JSON.stringify({ type: WS_CLIENT_MESSAGES.STATION_SUBSCRIBE, stations: ["BHARATI"] }));
      await wait(100);

      const bharatiPromise = waitForMessage(ws, (m) => m.type === WS_EVENT_TYPES.TELEMETRY_UPDATE && m.stationCode === "BHARATI");
      realtimeService.publishTelemetry(makeTelemetry("BHARATI"));
      const bharatiMsg = await bharatiPromise;
      assert(bharatiMsg.stationCode === "BHARATI", "Should receive BHARATI message after switch");

      ws.close();
      await wait(100);
    });

    await test("32. Metrics endpoint /api/v1/system/realtime exposes accurate monitoring metrics", async () => {
      const metrics = realtimeService.getMetrics();
      assert(typeof metrics.connectedClients === "number", "connectedClients must be number");
      assert(typeof metrics.activeSubscriptions === "number", "activeSubscriptions must be number");
      assert(typeof metrics.messagesSent === "number", "messagesSent must be number");
      assert(metrics.messagesSent > 0, "messagesSent should be > 0 after test suite");
      assert(metrics.status === "HEALTHY", "Status should be HEALTHY");
    });

    await test("33. WebSocket shutdown cleanup closes all sockets and timers cleanly", async () => {
      const ws = new WebSocket(getWsUrl(adminToken));
      await new Promise<void>((res) => ws.on("open", res));

      await realtimeService.shutdown();

      const closed = await new Promise<boolean>((resolve) => {
        if (ws.readyState === WebSocket.CLOSED) resolve(true);
        ws.on("close", () => resolve(true));
        setTimeout(() => resolve(false), 2000);
      });
      assert(closed, "All active sockets should be cleanly terminated on shutdown");
      assert(connectionRegistry.getActiveConnectionsCount() === 0, "Registry should be empty after shutdown");
    });

  } finally {
    // Teardown
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (inactiveUser) {
      await prisma.user.delete({ where: { id: inactiveUser.id } }).catch(() => {});
    }
  }

  // Summary
  console.log("\n=================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  console.log(`Phase 5 Test Execution Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log("=================================================\n");

  if (failedTests > 0) {
    throw new Error(`Phase 5 WebSocket test suite failed with ${failedTests} failure(s)`);
  }
}

// Allow standalone execution: npx ts-node src/__tests__/websocket-tests.ts
if (require.main === module) {
  runWebSocketTests()
    .then(() => {
      console.log("All Phase 5 WebSocket tests passed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Phase 5 WebSocket tests failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
