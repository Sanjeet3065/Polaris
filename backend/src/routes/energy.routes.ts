import { Router } from "express";
import { energyController } from "../controllers/energy.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema, historyQuerySchema } from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/energy/latest
router.get(
  "/latest",
  validateRequest({ params: stationIdParamSchema }),
  energyController.getLatestEnergy
);

// GET /api/v1/stations/:stationId/energy
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: historyQuerySchema
  }),
  energyController.getEnergyHistory
);

export default router;
