import { Router } from "express";
import { telemetryController } from "../controllers/telemetry.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema, historyQuerySchema } from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/telemetry/latest
router.get(
  "/latest",
  validateRequest({ params: stationIdParamSchema }),
  telemetryController.getLatestTelemetry
);

// GET /api/v1/stations/:stationId/telemetry
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: historyQuerySchema
  }),
  telemetryController.getTelemetryHistory
);

export default router;
