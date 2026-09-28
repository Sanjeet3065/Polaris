import { Alert } from "../types";

export const MOCK_ALERTS: Alert[] = [
  {
    id: "alt-001",
    stationCode: "MAITRI",
    severity: "WARNING",
    source: "ENERGY",
    title: "Battery discharge rate increased",
    description: "Battery Bank String 02 discharge rate exceeded 45 A during peak laboratory heating cycle.",
    status: "OPEN",
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  },
  {
    id: "alt-002",
    stationCode: "BHARATI",
    severity: "WARNING",
    source: "EQUIPMENT",
    title: "Generator 02 temperature above normal",
    description: "Cylinder head exhaust temperature reached 98.4 °C (nominal threshold: 92.0 °C).",
    status: "OPEN",
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString()
  },
  {
    id: "alt-003",
    stationCode: "MAITRI",
    severity: "INFO",
    source: "INVENTORY",
    title: "Inventory restock scheduled",
    description: "Bulk Jet A-1 arctic fuel resupply convoy confirmed from vessel MV Vasiliy Golovnin.",
    status: "OPEN",
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString()
  },
  {
    id: "alt-004",
    stationCode: "BHARATI",
    severity: "WARNING",
    source: "ENVIRONMENT",
    title: "Katabatic wind threshold approaching",
    description: "Sustained wind velocity increased to 44 km/h with gusts exceeding 68 km/h.",
    status: "OPEN",
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString()
  },
  {
    id: "alt-005",
    stationCode: "MAITRI",
    severity: "INFO",
    source: "COMMUNICATION",
    title: "VSAT satellite synchronization complete",
    description: "Geostationary data handshake completed with 0 packet drops over 15-minute window.",
    status: "RESOLVED",
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];
