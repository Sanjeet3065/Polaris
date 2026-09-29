import { Router } from "express";
import { predictiveMaintenanceController } from "../controllers/predictiveMaintenance.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  predictionsQuerySchema,
  equipmentIdParamSchema,
  healthOverviewQuerySchema,
  predictionHistoryQuerySchema,
  createWorkOrderSchema
} from "../validators/maintenance.validator";
import { UserRole } from "@prisma/client";

const router = Router();

// All predictive maintenance endpoints require authentication (Phase 3 & 10 Security)
router.use(authenticate);

// GET /api/v1/maintenance/health-overview
router.get(
  "/health-overview",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: healthOverviewQuerySchema }),
  predictiveMaintenanceController.getHealthOverview
);

// GET /api/v1/maintenance/predictions
router.get(
  "/predictions",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: predictionsQuerySchema }),
  predictiveMaintenanceController.getPredictions
);

// GET /api/v1/maintenance/predictions/:equipmentId
router.get(
  "/predictions/:equipmentId",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ params: equipmentIdParamSchema }),
  predictiveMaintenanceController.getPredictionByEquipmentId
);

// GET /api/v1/maintenance/predictions/:equipmentId/history
router.get(
  "/predictions/:equipmentId/history",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({
    params: equipmentIdParamSchema,
    query: predictionHistoryQuerySchema
  }),
  predictiveMaintenanceController.getPredictionHistory
);

// GET /api/v1/maintenance/predictions/:equipmentId/explanation
router.get(
  "/predictions/:equipmentId/explanation",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ params: equipmentIdParamSchema }),
  predictiveMaintenanceController.getExplanation
);

// POST /api/v1/maintenance/predictions/:equipmentId/refresh
router.post(
  "/predictions/:equipmentId/refresh",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ params: equipmentIdParamSchema }),
  predictiveMaintenanceController.refreshPrediction
);

// POST /api/v1/maintenance/predictions/:equipmentId/work-order
router.post(
  "/predictions/:equipmentId/work-order",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({
    params: equipmentIdParamSchema,
    body: createWorkOrderSchema
  }),
  predictiveMaintenanceController.createWorkOrder
);

export default router;
