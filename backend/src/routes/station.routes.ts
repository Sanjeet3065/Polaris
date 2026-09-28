import { Router } from "express";
import { stationController } from "../controllers/station.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema } from "../validators/station.validator";

import telemetryRoutes from "./telemetry.routes";
import energyRoutes from "./energy.routes";
import environmentRoutes from "./environment.routes";
import equipmentRoutes from "./equipment.routes";
import alertRoutes from "./alert.routes";
import eventRoutes from "./event.routes";
import inventoryRoutes from "./inventory.routes";
import maintenanceRoutes from "./maintenance.routes";

const router = Router();

// Mount nested station sub-routers
router.use("/:stationId/telemetry", telemetryRoutes);
router.use("/:stationId/energy", energyRoutes);
router.use("/:stationId/environment", environmentRoutes);
router.use("/:stationId/equipment", equipmentRoutes);
router.use("/:stationId/alerts", alertRoutes);
router.use("/:stationId/events", eventRoutes);
router.use("/:stationId/inventory", inventoryRoutes);
router.use("/:stationId/maintenance", maintenanceRoutes);

// GET /api/v1/stations/:stationId
router.get(
  "/:stationId",
  validateRequest({ params: stationIdParamSchema }),
  stationController.getStationById
);

// GET /api/v1/stations
router.get("/", stationController.getStations);

export default router;
