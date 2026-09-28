import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema, inventoryQuerySchema } from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/inventory
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: inventoryQuerySchema
  }),
  inventoryController.getStationInventory
);

// GET /api/v1/stations/:stationId/inventory/:itemId
router.get("/:itemId", inventoryController.getInventoryItemById);

export default router;
