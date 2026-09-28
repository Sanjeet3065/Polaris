import { OperationalEvent } from "../types";

export const MOCK_TIMELINE_EVENTS: OperationalEvent[] = [
  {
    id: "evt-001",
    timestamp: "2026-09-28T22:31:00Z",
    timeFormatted: "22:31 UTC",
    eventType: "TELEMETRY",
    description: "Telemetry synchronization completed with high-latitude gateway",
    status: "SUCCESS",
    stationCode: "MAITRI"
  },
  {
    id: "evt-002",
    timestamp: "2026-09-28T22:28:00Z",
    timeFormatted: "22:28 UTC",
    eventType: "HEALTH_CHECK",
    description: "Generator 02 automated diagnostic health check completed",
    status: "INFO",
    stationCode: "BHARATI"
  },
  {
    id: "evt-003",
    timestamp: "2026-09-28T22:17:00Z",
    timeFormatted: "22:17 UTC",
    eventType: "BATTERY",
    description: "Battery reserve state of charge stabilized above 80%",
    status: "SUCCESS",
    stationCode: "MAITRI"
  },
  {
    id: "evt-004",
    timestamp: "2026-09-28T22:04:00Z",
    timeFormatted: "22:04 UTC",
    eventType: "INVENTORY",
    description: "Autonomous inventory reconciliation & fuel farm metering logged",
    status: "SUCCESS",
    stationCode: "BHARATI"
  },
  {
    id: "evt-005",
    timestamp: "2026-09-28T21:56:00Z",
    timeFormatted: "21:56 UTC",
    eventType: "WEATHER",
    description: "Schirmacher Oasis microclimate sensor update received",
    status: "INFO",
    stationCode: "MAITRI"
  }
];
