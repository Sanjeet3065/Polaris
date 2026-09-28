import { Router } from "express";
import { environmentController } from "../controllers/environment.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema, historyQuerySchema } from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/environment/latest
router.get(
  "/latest",
  validateRequest({ params: stationIdParamSchema }),
  environmentController.getLatestEnvironment
);

// GET /api/v1/stations/:stationId/environment
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: historyQuerySchema
  }),
  environmentController.getEnvironmentalHistory
);

export default router;
