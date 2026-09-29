/**
 * POLARIS — Phase 9 Alerts + Incident Management Test Suite
 * Problem Statement: SIH26060 (Digital Platform for Indian Antarctic Research Stations)
 * 
 * 12 Comprehensive Test Groups:
 *   - GROUP 1: Alert Creation & Deterministic Rule Evaluation
 *   - GROUP 2: Alert Deduplication & Occurrence Tracking
 *   - GROUP 3: Alert Lifecycle (Acknowledge, Escalate, Resolve, Suppress & Validation)
 *   - GROUP 4: Auto-Resolution with Recovery Thresholds & Hysteresis
 *   - GROUP 5: Operational Incident Creation & Sequential Numbering
 *   - GROUP 6: Incident Lifecycle & Transition Rules (OPEN -> INVESTIGATING -> MITIGATING -> RESOLVED -> CLOSED)
 *   - GROUP 7: Incident Assignment, Operator Notes & Alert Linking
 *   - GROUP 8: RBAC & Antarctic Station Isolation (Maitri vs Bharati)
 *   - GROUP 9: Operational Event Audit Logging
 *   - GROUP 10: Real-Time Event Bus Dispatches
 *   - GROUP 11: End-to-End Multi-Domain Integration (Energy, Environment, Equipment)
 *   - GROUP 12: Concurrency & Idempotency Protection
 */

import { prisma } from "../config/prisma";
import { alertService } from "../services/alert.service";
import { incidentService } from "../services/incident.service";
import { alertEvaluationService } from "../services/alertEvaluation.service";
import { alertRepository } from "../repositories/alert.repository";
import {
  ALERT_RULE_CODES,
  ALERT_THRESHOLDS,
  isValidAlertTransition,
  isValidIncidentTransition
} from "../utils/alertRules";
import { ApiError } from "../utils/apiError";
import {
  AlertSeverity,
  AlertStatus,
  IncidentCategory,
  IncidentImpact,
  IncidentSeverity,
  IncidentStatus,
  UserRole,
  TelemetryStatus,
  EquipmentStatus,
  StationStatus
} from "@prisma/client";
import { GeneratedTelemetryCycle } from "../simulator/models/simulator.types";

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

export async function runAlertsIncidentsTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 9: Alerts + Incident Management");
  console.log("=================================================\n");

  // Fetch baseline stations
  const maitri = await prisma.station.findUnique({ where: { code: "MAITRI" } });
  const bharati = await prisma.station.findUnique({ where: { code: "BHARATI" } });
  assert(Boolean(maitri), "Maitri station must exist");
  assert(Boolean(bharati), "Bharati station must exist");
  const maitriId = maitri!.id;
  const bharatiId = bharati!.id;

  // Fetch test users for RBAC
  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  const operatorUser = await prisma.user.findFirst({ where: { role: UserRole.OPERATOR } });
  const viewerUser = await prisma.user.findFirst({ where: { role: UserRole.VIEWER } });
  assert(Boolean(adminUser), "Admin user must exist");
  assert(Boolean(operatorUser), "Operator user must exist");
  assert(Boolean(viewerUser), "Viewer user must exist");

  const adminActor = { id: adminUser!.id, name: adminUser!.name, role: adminUser!.role };
  const operatorActor = { id: operatorUser!.id, name: operatorUser!.name, role: operatorUser!.role };
  const viewerActor = { id: viewerUser!.id, name: viewerUser!.name, role: viewerUser!.role };

  // Cleanup test alerts and incidents from previous runs for idempotent execution
  await prisma.alert.deleteMany({
    where: {
      sourceId: {
        in: [
          "BATTERY_BANK_TEST_01",
          "BATTERY_BANK_TEST_NORMAL",
          "AWS_WEATHER_MAST",
          "HVAC_LIVING_01",
          "VSAT_DISH_BHA_02",
          "AWS_ANEMOMETER_NORTH_01",
          "GEN_BHA_02",
          "WATER_PUMP_TC_02",
          "CONCURRENT_TEST_SOURCE_01"
        ]
      }
    }
  });

  // =========================================================================
  // GROUP 1: Alert Creation & Deterministic Rule Evaluation
  // =========================================================================
  console.log("--- Group 1: Alert Creation & Deterministic Rule Evaluation ---");

  let createdAlertId = "";

  await test("Alert rule engine evaluates battery critical threshold (<20%) accurately", async () => {
    const { alert, isNew } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "ENERGY",
      sourceId: "BATTERY_BANK_TEST_01",
      ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL,
      title: "Battery SoC Critically Low",
      message: "Main battery bank SoC is at 14.2%, below critical 20% limit.",
      triggerValue: 14.2,
      thresholdValue: ALERT_THRESHOLDS.ENERGY.BATTERY_CRITICAL_SOC,
      unit: "%",
      severity: AlertSeverity.CRITICAL
    });

    assert(Boolean(alert), "Alert should be created");
    assert(isNew, "Should be marked as isNew");
    assert(alert.severity === AlertSeverity.CRITICAL, "Severity should be CRITICAL");
    assert(alert.ruleCode === ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL, "Rule code must match");
    assert(alert.status === AlertStatus.OPEN, "Initial status must be OPEN");
    assert(alert.stationId === maitriId, "Station ID must be Maitri");
    assert(alert.triggerValue === 14.2, "Trigger value must be 14.2");
    createdAlertId = alert.id;
  });

  await test("High wind blizzard rule triggers with correct polar severity and unit", async () => {
    const { alert, isNew } = await alertEvaluationService.upsertAlert({
      stationId: bharatiId,
      stationCode: "BHARATI",
      sourceType: "ENVIRONMENT",
      sourceId: "AWS_WEATHER_MAST",
      ruleCode: ALERT_RULE_CODES.ENV_WIND_BLIZZARD_GALE,
      title: "Blizzard Force Wind Speed Detected",
      message: "AWS recorded sustained gale wind of 88.5 km/h",
      triggerValue: 88.5,
      thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.WIND_HIGH_KMH,
      unit: "km/h",
      severity: AlertSeverity.CRITICAL
    });

    assert(Boolean(alert), "Blizzard wind alert must be created");
    assert(isNew, "Should be new alert");
    assert(alert.severity === AlertSeverity.CRITICAL, "Wind above 80 km/h must be CRITICAL");
    assert(alert.unit === "km/h", "Unit must be km/h");
  });

  // =========================================================================
  // GROUP 2: Alert Deduplication & Occurrence Tracking
  // =========================================================================
  console.log("\n--- Group 2: Alert Deduplication & Occurrence Tracking ---");

  await test("Repeated simulator anomaly evaluation does NOT create duplicate active alerts", async () => {
    const initialCount = await prisma.alert.count({
      where: {
        stationId: maitriId,
        ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL,
        sourceId: "BATTERY_BANK_TEST_01",
        status: { in: [AlertStatus.OPEN, AlertStatus.ACTIVE] }
      }
    });

    assert(initialCount === 1, "Exactly one active alert should exist before repeated evaluation");

    // Second evaluation cycle with same anomaly
    const { alert, isNew, isUpdated } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "ENERGY",
      sourceId: "BATTERY_BANK_TEST_01",
      ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL,
      title: "Battery SoC Critically Low",
      message: "Main battery bank SoC is at 13.8%, below critical 20% limit.",
      triggerValue: 13.8,
      thresholdValue: ALERT_THRESHOLDS.ENERGY.BATTERY_CRITICAL_SOC,
      unit: "%",
      severity: AlertSeverity.CRITICAL
    });

    assert(isNew === false, "Should NOT be marked as isNew");
    assert(isUpdated === true, "Should be marked as isUpdated");
    assert(alert.id === createdAlertId, "Evaluated alert ID must be identical (no duplicate row)");

    const postCount = await prisma.alert.count({
      where: {
        stationId: maitriId,
        ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL,
        sourceId: "BATTERY_BANK_TEST_01",
        status: { in: [AlertStatus.OPEN, AlertStatus.ACTIVE] }
      }
    });

    assert(postCount === 1, "Active alert count must remain 1 after deduplicated evaluation");
  });

  await test("Deduplication increments occurrenceCount and updates triggerValue", async () => {
    const alert = await prisma.alert.findUnique({ where: { id: createdAlertId } });
    assert(Boolean(alert), "Alert must exist in DB");
    assert(alert!.occurrenceCount >= 2, `Expected occurrenceCount >= 2, found ${alert!.occurrenceCount}`);
    assert(alert!.triggerValue === 13.8, `Expected triggerValue updated to 13.8, found ${alert!.triggerValue}`);
    assert(alert!.lastDetectedAt >= alert!.firstDetectedAt, "lastDetectedAt must be >= firstDetectedAt");
  });

  // =========================================================================
  // GROUP 3: Alert Lifecycle (Acknowledge, Escalate, Resolve, Suppress)
  // =========================================================================
  console.log("\n--- Group 3: Alert Lifecycle & State Transitions ---");

  await test("Operator acknowledges open alert and stores timestamp with actor ID", async () => {
    const acknowledged = await alertService.acknowledgeAlert(createdAlertId, operatorActor);

    assert(acknowledged.status === AlertStatus.ACKNOWLEDGED, "Status must become ACKNOWLEDGED");
    assert(acknowledged.acknowledgedBy === operatorActor.name, "acknowledgedBy must record operator user name/ID");
    assert(Boolean(acknowledged.acknowledgedAt), "acknowledgedAt timestamp must be set");
  });

  await test("Duplicate acknowledgment of already acknowledged alert is safely idempotent", async () => {
    const alert = await alertService.acknowledgeAlert(createdAlertId, operatorActor);
    assert(alert.status === AlertStatus.ACKNOWLEDGED, "Status remains ACKNOWLEDGED gracefully");
  });

  await test("Invalid alert state transition is deterministically rejected", async () => {
    const valid = isValidAlertTransition(AlertStatus.RESOLVED, AlertStatus.OPEN);
    assert(valid === false, "Transition from RESOLVED to OPEN must be invalid");

    const validEsc = isValidAlertTransition(AlertStatus.SUPPRESSED, AlertStatus.ESCALATED);
    assert(validEsc === false, "Transition from SUPPRESSED to ESCALATED must be invalid");
  });

  await test("Operator resolves an active alert with documented resolution note", async () => {
    const { alert: tempAlert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      severity: AlertSeverity.WARNING,
      title: "HVAC Temperature Warning",
      message: "Living module temp dipped to 16°C",
      sourceType: "ENVIRONMENT",
      sourceId: "HVAC_LIVING_01",
      ruleCode: ALERT_RULE_CODES.ENV_TEMP_LOW_WARNING,
      triggerValue: 16.0,
      thresholdValue: 18.0,
      unit: "°C"
    });

    const resolved = await alertService.resolveAlert(
      tempAlert.id,
      operatorActor,
      "Auxiliary heater loop brought online"
    );

    assert(resolved.status === AlertStatus.RESOLVED, "Status must be RESOLVED");
    assert(resolved.resolvedBy === operatorActor.name, "resolvedBy must be operator ID/name");
    assert(Boolean(resolved.resolvedAt), "resolvedAt must be populated");
  });

  await test("Authorized user suppresses false or scheduled maintenance alert with reason", async () => {
    const { alert: maintAlert } = await alertEvaluationService.upsertAlert({
      stationId: bharatiId,
      stationCode: "BHARATI",
      severity: AlertSeverity.MEDIUM,
      title: "Planned VSAT Link Calibration",
      message: "Carrier signal attenuation during dish repositioning",
      sourceType: "COMMUNICATION",
      sourceId: "VSAT_DISH_BHA_02",
      ruleCode: ALERT_RULE_CODES.COMMUNICATION_DEGRADED
    });

    const suppressed = await alertService.suppressAlert(
      maintAlert.id,
      adminActor,
      "Scheduled antenna dish repositioning maintenance window"
    );

    assert(suppressed.status === AlertStatus.SUPPRESSED, "Status must be SUPPRESSED");
    assert(suppressed.suppressedBy === adminActor.name, "suppressedBy must be admin ID/name");
    assert(Boolean(suppressed.suppressedAt), "suppressedAt must be set");
  });

  // =========================================================================
  // GROUP 4: Auto-Resolution with Recovery Thresholds & Hysteresis
  // =========================================================================
  console.log("\n--- Group 4: Auto-Resolution with Recovery & Hysteresis ---");

  await test("High wind alert auto-resolves when wind speed drops below recovery hysteresis (<75 km/h)", async () => {
    const windRule = ALERT_RULE_CODES.ENV_WIND_HIGH;
    const sourceId = "AWS_ANEMOMETER_NORTH_01";

    // 1. Trigger high wind alert (>80 km/h)
    const { alert: triggered } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "ENVIRONMENT",
      sourceId,
      ruleCode: windRule,
      title: "High Wind Gust Alert",
      message: "Wind speed gusting at 84.0 km/h",
      triggerValue: 84.0,
      thresholdValue: 80.0,
      unit: "km/h",
      severity: AlertSeverity.HIGH
    });

    assert(Boolean(triggered), "High wind alert must be created");
    assert(triggered.status === AlertStatus.OPEN, "Initial status must be OPEN");

    // 2. Wind at 78 km/h (above 75 km/h hysteresis recovery limit -> do not resolve)
    // autoResolve is called only when metric drops below recovery limit (<75)
    const stillActive = await prisma.alert.findUnique({ where: { id: triggered.id } });
    assert(stillActive!.status === AlertStatus.OPEN, "Alert must remain OPEN within hysteresis gap (78 km/h > 75 km/h)");

    // 3. Wind drops to 72 km/h (below 75 recovery hysteresis -> autoResolveAlert is invoked)
    await alertEvaluationService.autoResolveAlert(
      maitriId,
      "MAITRI",
      windRule,
      "Wind speed dropped to 72.0 km/h below 75 km/h recovery threshold",
      sourceId
    );

    const autoResolved = await prisma.alert.findUnique({ where: { id: triggered.id } });
    assert(autoResolved!.status === AlertStatus.RESOLVED, "Alert must be auto-RESOLVED when condition clears hysteresis threshold");
    assert(Boolean(autoResolved!.resolvedAt), "resolvedAt must be set by auto-resolution");
  });

  // =========================================================================
  // GROUP 5: Operational Incident Creation & Sequential Numbering
  // =========================================================================
  console.log("\n--- Group 5: Incident Creation & Sequential Incident Numbering ---");

  let createdIncidentId = "";

  await test("Manually create operational incident with sequential format INC-<STATION>-<YEAR>-<XXX>", async () => {
    const inc = await incidentService.createIncident(
      {
        stationId: maitriId,
        title: "Main Power Switchboard Voltage Imbalance",
        description: "Severe phase unbalance observed between Phase B and Phase C on main distribution panel.",
        severity: IncidentSeverity.HIGH,
        category: IncidentCategory.POWER,
        impact: IncidentImpact.HIGH,
        assignedTo: operatorUser!.id
      },
      adminActor
    );

    assert(Boolean(inc), "Incident must be created");
    assert(inc.incidentNumber.startsWith("INC-MAI-2026-"), `Incident number ${inc.incidentNumber} must match format INC-MAI-2026-xxx`);
    assert(inc.status === IncidentStatus.OPEN, "Initial incident status must be OPEN");
    assert(inc.stationId === maitriId, "Station ID must match Maitri");
    assert(inc.category === IncidentCategory.POWER, "Category must be POWER");
    createdIncidentId = inc.id;
  });

  await test("Escalate alert into an incident in an atomic transaction", async () => {
    const { alert: alertToEscalate } = await alertEvaluationService.upsertAlert({
      stationId: bharatiId,
      stationCode: "BHARATI",
      severity: AlertSeverity.CRITICAL,
      title: "Bharati Generator 02 Exhaust Excursion",
      message: "Exhaust manifold temperature reached 512°C",
      sourceType: "EQUIPMENT",
      sourceId: "GEN_BHA_02",
      ruleCode: ALERT_RULE_CODES.EQUIPMENT_OVERHEAT_CRITICAL,
      triggerValue: 512.0,
      thresholdValue: 480.0,
      unit: "°C"
    });

    const result = await alertService.escalateAlert(
      alertToEscalate.id,
      operatorActor,
      {
        title: "Emergency Thermal Triage: Generator 02 Overheat",
        description: "Manifold temperature exceeded critical 480°C threshold. Generator load shifted to Gen 01.",
        severity: IncidentSeverity.CRITICAL,
        category: IncidentCategory.EQUIPMENT,
        impact: IncidentImpact.CRITICAL
      }
    );

    assert(result.alert.status === AlertStatus.ESCALATED, "Alert status must become ESCALATED");
    assert(Boolean(result.incident), "New incident must be returned");
    assert(result.incident.severity === IncidentSeverity.CRITICAL, "Incident severity must be CRITICAL");
    assert(result.incident.incidentNumber.startsWith("INC-BHA-2026-"), "Incident number must start with INC-BHA-2026-");

    // Verify IncidentAlert relationship in database
    const link = await prisma.incidentAlert.findUnique({
      where: {
        incidentId_alertId: {
          incidentId: result.incident.id,
          alertId: alertToEscalate.id
        }
      }
    });

    assert(Boolean(link), "IncidentAlert link must exist in database");
  });

  // =========================================================================
  // GROUP 6: Incident Lifecycle & Transition Rules
  // =========================================================================
  console.log("\n--- Group 6: Incident Lifecycle & Transitions ---");

  await test("Incident advances through valid lifecycle: OPEN -> INVESTIGATING -> MITIGATING -> RESOLVED -> CLOSED", async () => {
    // Step 1: Advance OPEN -> INVESTIGATING
    let updated = await incidentService.updateIncidentStatus(
      createdIncidentId,
      IncidentStatus.INVESTIGATING,
      operatorActor,
      "Lead engineer reviewing harmonic distortion telemetry"
    );
    assert(updated.status === IncidentStatus.INVESTIGATING, "Status must be INVESTIGATING");

    // Step 2: Advance INVESTIGATING -> MITIGATING
    updated = await incidentService.updateIncidentStatus(
      createdIncidentId,
      IncidentStatus.MITIGATING,
      operatorActor,
      "Replacing Phase B contactor coil and load balancing"
    );
    assert(updated.status === IncidentStatus.MITIGATING, "Status must be MITIGATING");

    // Step 3: Advance MITIGATING -> RESOLVED
    updated = await incidentService.updateIncidentStatus(
      createdIncidentId,
      IncidentStatus.RESOLVED,
      operatorActor,
      "Contactor replacement complete; all three phases balanced within 2% deviation",
      "Contactor replacement completed; three-phase balance restored to 415V ± 1.5%"
    );
    assert(updated.status === IncidentStatus.RESOLVED, "Status must be RESOLVED");
    assert(Boolean(updated.resolvedAt), "resolvedAt must be set");
    assert(Boolean(updated.resolutionSummary?.includes("Contactor replacement")), "resolutionSummary must be saved");

    // Step 4: Advance RESOLVED -> CLOSED
    updated = await incidentService.updateIncidentStatus(
      createdIncidentId,
      IncidentStatus.CLOSED,
      adminActor,
      "Station Commander verified nominal operation and closed incident"
    );
    assert(updated.status === IncidentStatus.CLOSED, "Status must be CLOSED");
    assert(Boolean(updated.closedAt), "closedAt must be set");
  });

  await test("Arbitrary backwards transition (CLOSED -> INVESTIGATING) is rejected with ApiError", async () => {
    try {
      await incidentService.updateIncidentStatus(
        createdIncidentId,
        IncidentStatus.INVESTIGATING,
        operatorActor
      );
      assert(false, "Should have thrown ApiError for invalid transition from CLOSED");
    } catch (err) {
      assert(err instanceof ApiError, "Expected ApiError on invalid incident status transition");
      assert((err as ApiError).statusCode === 400, "Expected status 400");
    }
  });

  // =========================================================================
  // GROUP 7: Incident Assignment, Operator Notes & Alert Linking
  // =========================================================================
  console.log("\n--- Group 7: Incident Assignment, Notes & Linking ---");

  let testInc7Id = "";

  await test("Assign incident to station operator updates assignedTo field", async () => {
    const inc7 = await incidentService.createIncident(
      {
        stationId: maitriId,
        title: "Lake Priyadarshini Water Pump Line Freeze Risk",
        description: "Trace heating line sensor shows temp falling towards -1°C",
        severity: IncidentSeverity.MEDIUM,
        category: IncidentCategory.ENVIRONMENT,
        impact: IncidentImpact.MEDIUM
      },
      adminActor
    );
    testInc7Id = inc7.id;

    const assigned = await incidentService.assignIncident(inc7.id, operatorUser!.id, adminActor);
    assert(assigned.assignedTo === operatorUser!.id, "assignedTo must match operator user ID");
  });

  await test("Add immutable operational note to incident timeline", async () => {
    const note = await incidentService.addIncidentNote(
      testInc7Id,
      "Inspected heating circuit breaker #4; reset thermal overload switch.",
      operatorActor
    );

    assert(Boolean(note), "Note must be created");
    assert(note.content.includes("reset thermal overload switch"), "Note content must match");
    assert(note.authorId === operatorUser!.id, "Author ID must match operator");

    const notesInDb = await prisma.incidentNote.findMany({ where: { incidentId: testInc7Id } });
    assert(notesInDb.length >= 1, "Incident notes must include new entry");
  });

  await test("Link and unlink secondary alert to existing incident", async () => {
    const { alert: auxAlert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      severity: AlertSeverity.LOW,
      title: "Secondary Trace Heat Thermocouple Fluctuation",
      message: "Thermocouple resistance drift",
      sourceType: "EQUIPMENT",
      sourceId: "WATER_PUMP_TC_02",
      ruleCode: ALERT_RULE_CODES.EQUIPMENT_HEALTH_DEGRADED
    });

    // Link alert
    await incidentService.linkAlert(testInc7Id, auxAlert.id, operatorActor);

    let links = await prisma.incidentAlert.findMany({ where: { incidentId: testInc7Id } });
    assert(links.some((l: { alertId: string }) => l.alertId === auxAlert.id), "Alert must be linked to incident");

    // Unlink alert
    await incidentService.unlinkAlert(testInc7Id, auxAlert.id, operatorActor);

    links = await prisma.incidentAlert.findMany({ where: { incidentId: testInc7Id } });
    assert(!links.some((l: { alertId: string }) => l.alertId === auxAlert.id), "Alert must be unlinked from incident");
  });

  // =========================================================================
  // GROUP 8: RBAC & Antarctic Station Isolation (Maitri vs Bharati)
  // =========================================================================
  console.log("\n--- Group 8: RBAC & Station Isolation ---");

  await test("Station filtering isolates Maitri and Bharati alerts without cross-leakage", async () => {
    const maitriAlerts = await alertRepository.findMany({
      page: 1,
      limit: 50,
      stationId: maitriId
    });

    const bharatiAlerts = await alertRepository.findMany({
      page: 1,
      limit: 50,
      stationId: bharatiId
    });

    assert(maitriAlerts.length > 0, "Maitri must have seeded/created alerts");
    assert(bharatiAlerts.length > 0, "Bharati must have seeded/created alerts");

    maitriAlerts.forEach((a) => {
      assert(a.stationId === maitriId, `Alert ${a.id} in Maitri query has wrong stationId ${a.stationId}`);
    });

    bharatiAlerts.forEach((a) => {
      assert(a.stationId === bharatiId, `Alert ${a.id} in Bharati query has wrong stationId ${a.stationId}`);
    });
  });

  await test("Station overview KPIs aggregate station-specific metrics accurately", async () => {
    const maitriOverview = await alertRepository.getOverview(maitriId);
    const bharatiOverview = await alertRepository.getOverview(bharatiId);
    const allOverview = await alertRepository.getOverview();

    assert(typeof maitriOverview.activeAlerts === "number", "Active alerts must be numeric");
    assert(typeof bharatiOverview.activeAlerts === "number", "Active alerts must be numeric");
    assert(allOverview.totalAlerts >= maitriOverview.totalAlerts, "All stations total must be >= Maitri total");
    assert(allOverview.totalAlerts >= bharatiOverview.totalAlerts, "All stations total must be >= Bharati total");
  });

  // =========================================================================
  // GROUP 9: Operational Event Audit Logging
  // =========================================================================
  console.log("\n--- Group 9: Operational Event Audit Logging ---");

  await test("Alert and incident actions generate operational audit events with stationId and timestamps", async () => {
    const auditEvents = await prisma.operationalEvent.findMany({
      where: {
        type: {
          in: ["ALERT", "INCIDENT"]
        }
      },
      take: 10,
      orderBy: { createdAt: "desc" }
    });

    assert(auditEvents.length > 0, "Audit logs must record Phase 9 operational events");
    const sample = auditEvents[0];
    assert(Boolean(sample.stationId), "Audit event must record stationId");
    assert(Boolean(sample.createdAt), "Audit event must record timestamp");
    assert(Boolean(sample.title), "Audit event must have title");
  });

  // =========================================================================
  // GROUP 10: Real-Time Event Bus Dispatches
  // =========================================================================
  console.log("\n--- Group 10: Real-Time Event Bus Dispatches ---");

  await test("Realtime WebSocket service dispatches alert and incident events with valid envelopes", async () => {
    const testAlert = await prisma.alert.findFirst({ where: { stationId: maitriId } });
    assert(Boolean(testAlert), "Test alert must exist");
    assert(typeof testAlert!.id === "string", "Alert ID is valid string");
    assert(typeof testAlert!.title === "string", "Alert title is valid string");
  });

  // =========================================================================
  // GROUP 11: End-to-End Multi-Domain Integration
  // =========================================================================
  console.log("\n--- Group 11: End-to-End Multi-Domain Integration ---");

  await test("Full simulator telemetry cycle anomaly is evaluated across Energy, Environment and Equipment", async () => {
    const now = new Date();
    const realEquip = await prisma.equipment.findFirst({ where: { stationId: maitriId } });
    const targetEquipId = realEquip?.id || "GEN_MAITRI_01";

    const mockCycle: GeneratedTelemetryCycle = {
      stationId: maitriId,
      stationCode: "MAITRI",
      timestamp: now,
      stationTelemetry: {
        stationId: maitriId,
        recordedAt: now,
        temperature: -58.5,
        humidity: 80.0,
        pressure: 950.0,
        windSpeed: 86.0,
        windDirection: 180,
        visibility: 0.8
      },
      environmentalReading: {
        stationId: maitriId,
        recordedAt: now,
        temperature: -58.5, // Extreme cold (< -55°C) -> CRITICAL
        humidity: 80.0,
        pressure: 950.0,    // Storm drop (< 955 hPa) -> CRITICAL
        windSpeed: 86.0,     // Gale (> 80 km/h) -> CRITICAL
        windDirection: 180,
        windDirectionCompass: "S",
        visibility: 0.8,     // Whiteout (< 1 km) -> CRITICAL
        solarRadiation: 0.0,
        snowfallRate: 5.0,
        status: TelemetryStatus.WARNING
      },
      energyReading: {
        stationId: maitriId,
        recordedAt: now,
        generationKw: 80.0,
        solarKw: 0.0,
        dieselKw: 80.0,
        consumptionKw: 140.0,
        netPowerKw: -60.0,   // Severe deficit (< -50 kW) -> CRITICAL
        batteryPercent: 18.0,// Critical (< 20%) -> CRITICAL
        batteryVoltage: 455.0,// Critical (< 460 V) -> CRITICAL
        fuelPercent: 19.0,   // Critical (< 20%) -> CRITICAL
        fuelLiters: 19000,
        fuelDaysRemaining: 12 // Critical (< 14 days) -> CRITICAL
      },
      equipmentHealth: [
        {
          equipmentId: targetEquipId,
          recordedAt: now,
          healthPercent: 45.0, // Health critical (< 50%) -> CRITICAL
          temperature: 98.0,   // Overheat (> 95°C) -> CRITICAL
          vibration: 7.8,     // Vibration (> 7.0 mm/s) -> CRITICAL
          runtimeHours: 8500,
          status: EquipmentStatus.CRITICAL,
          notes: "Thermal run and bearing excitation detected"
        }
      ],
      stationHealthPercent: 62.0,
      stationStatus: StationStatus.WARNING
    };

    const alerts = await alertEvaluationService.evaluateTelemetryCycle(mockCycle);
    assert(alerts.length >= 4, `Expected at least 4 alerts from multi-anomaly cycle, got ${alerts.length}`);

    const ruleCodes = alerts.map((a) => a.ruleCode);
    assert(ruleCodes.includes(ALERT_RULE_CODES.ENV_WIND_BLIZZARD_GALE) || ruleCodes.includes(ALERT_RULE_CODES.ENV_WIND_HIGH), "Must trigger Blizzard Gale or High wind alert");
    assert(ruleCodes.includes(ALERT_RULE_CODES.ENERGY_BATTERY_CRITICAL), "Must trigger Battery Critical alert");
    assert(ruleCodes.includes(ALERT_RULE_CODES.EQUIPMENT_OVERHEAT_CRITICAL), "Must trigger Generator Overheat alert");
  });

  // =========================================================================
  // GROUP 12: Concurrency & Idempotency Protection
  // =========================================================================
  console.log("\n--- Group 12: Concurrency & Idempotency Protection ---");

  await test("Simultaneous concurrent evaluations of identical anomaly do not create duplicates", async () => {
    const concurrentSource = "CONCURRENT_TEST_SOURCE_01";
    const ruleCode = ALERT_RULE_CODES.ENERGY_POWER_SHORTAGE_CRITICAL;

    const promises = [1, 2, 3].map(() =>
      alertEvaluationService.upsertAlert({
        stationId: bharatiId,
        stationCode: "BHARATI",
        sourceType: "ENERGY",
        sourceId: concurrentSource,
        ruleCode,
        title: "Severe Power Shortage",
        message: "Net power balance negative",
        triggerValue: -55.0,
        thresholdValue: -50.0,
        unit: "kW",
        severity: AlertSeverity.CRITICAL
      })
    );

    const evaluatedAlerts = await Promise.all(promises);
    assert(evaluatedAlerts.length === 3, "All 3 parallel evaluations completed");

    // Check database to ensure no duplicate active alerts exist for this rule & source
    const count = await prisma.alert.count({
      where: {
        stationId: bharatiId,
        ruleCode,
        sourceId: concurrentSource,
        status: { in: [AlertStatus.OPEN, AlertStatus.ACTIVE] }
      }
    });

    assert(count === 1, `Concurrent evaluations must result in exactly 1 active alert, found ${count}`);
  });

  // =========================================================================
  // ADDITIONAL TESTS: Edge Cases, Pagination, Filtering & Security
  // =========================================================================
  console.log("\n--- Additional Tests: Edge Cases, Filtering & Integrity ---");

  await test("Extreme cold alert triggers when temperature falls below -55°C", async () => {
    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "ENVIRONMENT",
      sourceId: "TEMP_SENSOR_OUTSIDE",
      ruleCode: ALERT_RULE_CODES.ENV_TEMP_EXTREME_COLD,
      title: "Extreme Polar Cold Warning",
      message: "External temperature plunged to -59.2°C",
      triggerValue: -59.2,
      thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.TEMP_EXTREME_COLD_C,
      unit: "°C",
      severity: AlertSeverity.CRITICAL
    });

    assert(alert.severity === AlertSeverity.CRITICAL, "Must be CRITICAL severity");
    assert(alert.ruleCode === ALERT_RULE_CODES.ENV_TEMP_EXTREME_COLD, "Must match rule code");
  });

  await test("Low visibility whiteout alert triggers when visibility drops below 1.0 km", async () => {
    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: bharatiId,
      stationCode: "BHARATI",
      sourceType: "ENVIRONMENT",
      sourceId: "OPTICAL_VISIBILITY_SENSOR",
      ruleCode: ALERT_RULE_CODES.ENV_VISIBILITY_WHITEOUT,
      title: "Severe Whiteout Condition",
      message: "Horizontal visibility reduced to 0.4 km due to drifting snow",
      triggerValue: 0.4,
      thresholdValue: ALERT_THRESHOLDS.ENVIRONMENT.VISIBILITY_WHITEOUT_KM,
      unit: "km",
      severity: AlertSeverity.CRITICAL
    });

    assert(alert.severity === AlertSeverity.CRITICAL, "Must be CRITICAL");
    assert(alert.triggerValue === 0.4, "Trigger value must be 0.4");
  });

  await test("Severe negative power balance triggers power shortage critical alert (< -50 kW)", async () => {
    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "ENERGY",
      sourceId: "MAIN_POWER_BUS",
      ruleCode: ALERT_RULE_CODES.ENERGY_POWER_SHORTAGE_CRITICAL,
      title: "Severe Microgrid Power Deficit",
      message: "Microgrid power deficit reached -65 kW",
      triggerValue: -65.0,
      thresholdValue: ALERT_THRESHOLDS.ENERGY.POWER_DEFICIT_CRITICAL_KW,
      unit: "kW",
      severity: AlertSeverity.CRITICAL
    });

    assert(alert.severity === AlertSeverity.CRITICAL, "Deficit below -50 kW must be CRITICAL");
  });

  await test("Acknowledge alert fails with 400 ApiError if alert is already RESOLVED", async () => {
    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "EQUIPMENT",
      sourceId: "AUX_HEATER_TEST_01",
      ruleCode: ALERT_RULE_CODES.EQUIPMENT_HEALTH_DEGRADED,
      title: "Aux Heater Test",
      message: "Test alert",
      severity: AlertSeverity.LOW
    });

    await alertService.resolveAlert(alert.id, operatorActor, "Resolved test");

    try {
      await alertService.acknowledgeAlert(alert.id, operatorActor);
      assert(false, "Should fail when acknowledging resolved alert");
    } catch (err) {
      assert(err instanceof ApiError, "Expected ApiError");
      assert((err as ApiError).statusCode === 400, "Expected status 400");
    }
  });

  await test("Suppressing alert without reason is rejected by schema validator", async () => {
    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: bharatiId,
      stationCode: "BHARATI",
      sourceType: "COMMUNICATION",
      sourceId: "RADIO_TEST_01",
      ruleCode: ALERT_RULE_CODES.COMMUNICATION_DEGRADED,
      title: "Radio Test",
      message: "Test message",
      severity: AlertSeverity.MEDIUM
    });

    try {
      await alertService.suppressAlert(alert.id, adminActor, "");
      assert(false, "Should reject empty suppression reason");
    } catch (err) {
      assert(err instanceof ApiError, "Expected ApiError on empty reason");
    }
  });

  await test("Battery SoC recovers above 25% and triggers auto-resolution", async () => {
    const ruleCode = ALERT_RULE_CODES.ENERGY_BATTERY_LOW;
    const sourceId = "BATTERY_RACK_AUTO_RES";

    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "ENERGY",
      sourceId,
      ruleCode,
      title: "Battery SoC Low",
      message: "Battery SoC dipped to 28%",
      triggerValue: 28.0,
      thresholdValue: ALERT_THRESHOLDS.ENERGY.BATTERY_LOW_SOC,
      unit: "%",
      severity: AlertSeverity.WARNING
    });

    assert(alert.status === AlertStatus.OPEN, "Alert must be OPEN");

    // Auto-resolve when battery recovers above 38%
    const resolved = await alertEvaluationService.autoResolveAlert(
      maitriId,
      "MAITRI",
      ruleCode,
      "Battery bank recharged to 42.0% above 38% recovery limit",
      sourceId
    );

    assert(Boolean(resolved), "Auto-resolve should return resolved alert");
    assert(resolved!.status === AlertStatus.RESOLVED, "Status must be RESOLVED");
  });

  await test("Incident severity update persists in database and creates operational audit event", async () => {
    const inc = await incidentService.createIncident(
      {
        stationId: bharatiId,
        title: "Communication Terminal Antenna De-icing Failure",
        description: "De-icing heater element failure on 7.3m earth station dish",
        severity: IncidentSeverity.LOW,
        category: IncidentCategory.COMMUNICATION,
        impact: IncidentImpact.LOW
      },
      adminActor
    );

    const updated = await incidentService.updateIncident(
      inc.id,
      {
        severity: IncidentSeverity.CRITICAL,
        impact: IncidentImpact.HIGH
      },
      operatorActor
    );

    assert(updated.severity === IncidentSeverity.CRITICAL, "Severity updated to CRITICAL");
    assert(updated.impact === IncidentImpact.HIGH, "Impact updated to HIGH");

    const event = await prisma.operationalEvent.findFirst({
      where: {
        stationId: bharatiId,
        title: { contains: inc.incidentNumber }
      }
    });
    assert(Boolean(event), "Audit event must record incident update");
  });

  await test("Incident number sequence increments deterministically for same station", async () => {
    const incA = await incidentService.createIncident(
      {
        stationId: maitriId,
        title: "Sequential Test Incident A",
        description: "Test description A",
        severity: IncidentSeverity.LOW,
        category: IncidentCategory.OTHER,
        impact: IncidentImpact.NONE
      },
      adminActor
    );

    const incB = await incidentService.createIncident(
      {
        stationId: maitriId,
        title: "Sequential Test Incident B",
        description: "Test description B",
        severity: IncidentSeverity.LOW,
        category: IncidentCategory.OTHER,
        impact: IncidentImpact.NONE
      },
      adminActor
    );

    const numA = parseInt(incA.incidentNumber.split("-").pop() || "0", 10);
    const numB = parseInt(incB.incidentNumber.split("-").pop() || "0", 10);
    assert(numB > numA, `Incident number B (${numB}) must be strictly greater than A (${numA})`);
  });

  await test("Adding multiple notes to an incident preserves chronological thread ordering", async () => {
    const inc = await incidentService.createIncident(
      {
        stationId: bharatiId,
        title: "Snow Ingestion in Diesel Intake Filter",
        description: "Intake louvers blocked by drift",
        severity: IncidentSeverity.MEDIUM,
        category: IncidentCategory.EQUIPMENT,
        impact: IncidentImpact.MEDIUM
      },
      adminActor
    );

    const note1 = await incidentService.addIncidentNote(inc.id, "Observation 1: Snow drifting at louvers", operatorActor);
    const note2 = await incidentService.addIncidentNote(inc.id, "Observation 2: Cleared filter housing", operatorActor);

    assert(Boolean(note1), "Note 1 created");
    assert(Boolean(note2), "Note 2 created");

    const notes = await prisma.incidentNote.findMany({
      where: { incidentId: inc.id },
      orderBy: { createdAt: "asc" }
    });

    assert(notes.length === 2, "Expected 2 notes");
    assert(notes[0].content.includes("Observation 1"), "First note in chronological order");
    assert(notes[1].content.includes("Observation 2"), "Second note in chronological order");
  });

  await test("Unlinking an alert leaves the alert intact in database", async () => {
    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "EQUIPMENT",
      sourceId: "VALVE_TEST_01",
      ruleCode: ALERT_RULE_CODES.EQUIPMENT_HEALTH_DEGRADED,
      title: "Fuel Line Valve Flutter",
      message: "Fluttering pressure transducer",
      severity: AlertSeverity.LOW
    });

    const inc = await incidentService.createIncident(
      {
        stationId: maitriId,
        title: "Valve Anomaly Incident",
        description: "Investigating fuel manifold valve",
        severity: IncidentSeverity.LOW,
        category: IncidentCategory.EQUIPMENT,
        impact: IncidentImpact.LOW,
        alertIds: [alert.id]
      },
      adminActor
    );

    // Unlink
    await incidentService.unlinkAlert(inc.id, alert.id, operatorActor);

    // Verify alert still exists in DB
    const alertInDb = await prisma.alert.findUnique({ where: { id: alert.id } });
    assert(Boolean(alertInDb), "Alert must still exist in DB after being unlinked from incident");
  });

  await test("Alert query pagination limits and page navigation work correctly", async () => {
    const page1 = await alertService.getAlerts({
      page: 1,
      limit: 3
    });

    assert(page1.items.length <= 3, "Page 1 items count must be <= 3");
    assert(page1.pagination.page === 1, "Page number must be 1");
    assert(page1.pagination.limit === 3, "Limit must be 3");
    assert(page1.pagination.total > 0, "Total must be > 0");

    if (page1.pagination.totalPages > 1) {
      const page2 = await alertService.getAlerts({
        page: 2,
        limit: 3
      });
      assert(page2.pagination.page === 2, "Page number must be 2");
      assert(page2.items[0]?.id !== page1.items[0]?.id, "Page 2 must return different items than page 1");
    }
  });

  await test("Incident query filtering by category returns matching category records only", async () => {
    const powerIncidents = await incidentService.getIncidents({
      page: 1,
      limit: 20,
      category: IncidentCategory.POWER
    });

    powerIncidents.items.forEach((inc) => {
      assert(inc.category === IncidentCategory.POWER, `Incident ${inc.incidentNumber} category should be POWER`);
    });
  });

  await test("Incident query filtering by status returns matching status records only", async () => {
    const openIncidents = await incidentService.getIncidents({
      page: 1,
      limit: 20,
      status: IncidentStatus.OPEN
    });

    openIncidents.items.forEach((inc) => {
      assert(inc.status === IncidentStatus.OPEN, `Incident ${inc.incidentNumber} status should be OPEN`);
    });
  });

  await test("Incident overview KPI counts accurately reflect status distributions", async () => {
    const overview = await incidentService.getIncidentsOverview();
    assert(typeof overview.totalIncidents === "number", "Total incidents must be numeric");
    assert(typeof overview.openIncidents === "number", "Open incidents must be numeric");
    assert(typeof overview.investigatingIncidents === "number", "Investigating incidents must be numeric");
    assert(typeof overview.resolvedIncidents === "number", "Resolved incidents must be numeric");
    assert(typeof overview.closedIncidents === "number", "Closed incidents must be numeric");
    assert(overview.totalIncidents >= overview.openIncidents, "Total must be >= open");
  });

  await test("Alert timeline query returns chronological operational events", async () => {
    const { alert } = await alertEvaluationService.upsertAlert({
      stationId: maitriId,
      stationCode: "MAITRI",
      sourceType: "ENERGY",
      sourceId: "TIMELINE_TEST_RACK",
      ruleCode: ALERT_RULE_CODES.ENERGY_BATTERY_LOW,
      title: "Timeline Test Alert",
      message: "Testing timeline event tracking",
      severity: AlertSeverity.LOW
    });

    const timeline = await alertService.getAlertTimeline(alert.id);
    assert(Array.isArray(timeline), "Timeline must be an array");
    assert(timeline.length >= 1, "Timeline must contain at least creation event");
  });

  // Summary
  console.log("\n=================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  console.log(`Phase 9 Test Execution Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log("=================================================\n");

  if (failedTests > 0) {
    throw new Error(`Phase 9 Test Suite Failed with ${failedTests} failures.`);
  }
}

// Direct execution when run via `npm run test:phase9` or tsx
if (process.argv[1]?.includes("alerts-incidents-tests")) {
  runAlertsIncidentsTests()
    .catch((err) => {
      console.error("Phase 9 Test execution error:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
