import { Router } from "express";
import { maintenanceController } from "../controllers/maintenance.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema, maintenanceQuerySchema } from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/maintenance
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: maintenanceQuerySchema
  }),
  maintenanceController.getStationMaintenance
);

// GET /api/v1/stations/:stationId/maintenance/:recordId
router.get("/:recordId", maintenanceController.getMaintenanceRecordById);

export default router;
