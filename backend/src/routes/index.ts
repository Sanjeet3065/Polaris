import { Router } from "express";
import healthRoutes from "./health.routes";
import stationRoutes from "./station.routes";
import authRoutes from "./auth.routes";
import simulatorRoutes from "../simulator/simulator.routes";
import realtimeRoutes from "./realtime.routes";
import inventoryRoutes from "./inventory.routes";
import logisticsRoutes from "./logistics.routes";
import alertsRootRoutes from "./alerts.root.routes";
import incidentRoutes from "./incident.routes";
import predictiveMaintenanceRoutes from "./predictiveMaintenance.routes";
import analyticsRoutes from "./analytics.routes";
import reportRoutes from "./report.routes";
import assistantRoutes from "./assistant.routes";

const router = Router();

// Mount Health Check endpoint
router.use("/health", healthRoutes);

// Mount Authentication & RBAC APIs
router.use("/auth", authRoutes);

// Mount Stations Data APIs
router.use("/stations", stationRoutes);

// Mount Centralized Alert Management APIs (Phase 9)
router.use("/alerts", alertsRootRoutes);

// Mount Operational Incident Command APIs (Phase 9)
router.use("/incidents", incidentRoutes);

// Mount AI Predictive Maintenance APIs (Phase 10)
router.use("/maintenance", predictiveMaintenanceRoutes);

// Mount Analytics & Operational Intelligence APIs (Phase 11)
router.use("/analytics", analyticsRoutes);

// Mount Reports & Compliance Governance APIs (Phase 11)
router.use("/reports", reportRoutes);

// Mount AI Operations Assistant APIs (Phase 12)
router.use("/assistant", assistantRoutes);

// Mount Logistics & Polar Shipments APIs
router.use("/logistics", logisticsRoutes);

// Mount Inventory Management APIs
router.use("/inventory", inventoryRoutes);

// Mount Sensor / IoT Telemetry Simulator APIs
router.use("/simulator", simulatorRoutes);

// Mount System & Realtime Monitoring APIs
router.use("/system", realtimeRoutes);

export default router;

