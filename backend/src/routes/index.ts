import { Router } from "express";
import healthRoutes from "./health.routes";
import stationRoutes from "./station.routes";
import authRoutes from "./auth.routes";
import simulatorRoutes from "../simulator/simulator.routes";
import realtimeRoutes from "./realtime.routes";
import inventoryRoutes from "./inventory.routes";
import logisticsRoutes from "./logistics.routes";

const router = Router();

// Mount Health Check endpoint
router.use("/health", healthRoutes);

// Mount Authentication & RBAC APIs
router.use("/auth", authRoutes);

// Mount Stations Data APIs
router.use("/stations", stationRoutes);

// Mount Logistics & Polar Shipments APIs
router.use("/logistics", logisticsRoutes);

// Mount Inventory Management APIs
router.use("/inventory", inventoryRoutes);

// Mount Sensor / IoT Telemetry Simulator APIs
router.use("/simulator", simulatorRoutes);

// Mount System & Realtime Monitoring APIs
router.use("/system", realtimeRoutes);

export default router;

