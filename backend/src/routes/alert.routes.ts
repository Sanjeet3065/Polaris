import { Router } from "express";
import { alertController } from "../controllers/alert.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema, alertQuerySchema } from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/alerts
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: alertQuerySchema
  }),
  alertController.getStationAlerts
);

// GET /api/v1/stations/:stationId/alerts/:alertId
router.get("/:alertId", alertController.getAlertById);

export default router;
