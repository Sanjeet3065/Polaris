import { Router } from "express";
import { logisticsController } from "../controllers/logistics.controller";
import { validateRequest } from "../middleware/validateRequest";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { UserRole } from "@prisma/client";
import {
  shipmentQuerySchema,
  createShipmentSchema,
  updateShipmentStatusSchema,
  receiveShipmentSchema
} from "../validators/inventory.validator";

const router = Router();

// Require authentication for all logistics endpoints
router.use(authenticate);

// GET /api/v1/logistics (list shipments)
router.get(
  "/",
  validateRequest({ query: shipmentQuerySchema }),
  logisticsController.getShipments
);

// GET /api/v1/logistics/overview
router.get("/overview", logisticsController.getOverview);

// GET /api/v1/logistics/:id (shipment manifest & timeline)
router.get("/:id", logisticsController.getShipmentById);

// POST /api/v1/logistics (create shipment)
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: createShipmentSchema }),
  logisticsController.createShipment
);

// PATCH /api/v1/logistics/:id (update status/timeline)
router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: updateShipmentStatusSchema }),
  logisticsController.updateShipmentStatus
);

// POST /api/v1/logistics/:id/receive (receive verified cargo into station inventory)
router.post(
  "/:id/receive",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: receiveShipmentSchema }),
  logisticsController.receiveShipmentCargo
);

export default router;
