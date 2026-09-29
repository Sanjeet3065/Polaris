import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { UserRole } from "@prisma/client";
import {
  inventoryQuerySchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  recordStockMovementSchema,
  transferStockSchema
} from "../validators/inventory.validator";

const router = Router({ mergeParams: true });

// Require authentication for all inventory endpoints
router.use(authenticate);

// GET /api/v1/inventory or /api/v1/stations/:stationId/inventory
router.get(
  "/",
  validateRequest({ query: inventoryQuerySchema }),
  inventoryController.getInventory
);

// GET /api/v1/inventory/overview or /api/v1/stations/:stationId/inventory/overview
router.get("/overview", inventoryController.getOverview);

// GET /api/v1/inventory/movements
router.get("/movements", inventoryController.getMovements);

// POST /api/v1/inventory/transfer (inter-station supply transfer)
router.post(
  "/transfer",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: transferStockSchema }),
  inventoryController.transferStock
);

// GET /api/v1/inventory/:id or /api/v1/stations/:stationId/inventory/:itemId
router.get("/:id", inventoryController.getInventoryItemById);

// POST /api/v1/inventory or /api/v1/stations/:stationId/inventory
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: createInventoryItemSchema }),
  inventoryController.createInventoryItem
);

// PATCH /api/v1/inventory/:id or /api/v1/stations/:stationId/inventory/:itemId
router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: updateInventoryItemSchema }),
  inventoryController.updateInventoryItem
);

// POST /api/v1/inventory/:id/movements
router.post(
  "/:id/movements",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: recordStockMovementSchema }),
  inventoryController.recordMovement
);

// GET /api/v1/inventory/:id/movements
router.get("/:id/movements", inventoryController.getMovements);

export default router;
