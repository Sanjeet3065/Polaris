import { Router } from "express";
import { equipmentController } from "../controllers/equipment.controller";
import { validateRequest } from "../middleware/validateRequest";
import {
  stationIdParamSchema,
  equipmentQuerySchema,
  paginationQuerySchema
} from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/equipment
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: equipmentQuerySchema
  }),
  equipmentController.getStationEquipment
);

// GET /api/v1/stations/:stationId/equipment/:equipmentId
router.get("/:equipmentId", equipmentController.getEquipmentById);

// GET /api/v1/stations/:stationId/equipment/:equipmentId/health
router.get(
  "/:equipmentId/health",
  validateRequest({
    query: paginationQuerySchema
  }),
  equipmentController.getEquipmentHealth
);

export default router;
