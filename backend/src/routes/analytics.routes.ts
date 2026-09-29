import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import { analyticsFilterQuerySchema } from "../validators/analytics.validator";
import { UserRole } from "@prisma/client";

const router = Router();

// Protect all analytics endpoints with JWT authentication & RBAC
router.use(authenticate);

// GET /api/v1/analytics/overview
router.get(
  "/overview",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getOverview
);

// GET /api/v1/analytics/energy
router.get(
  "/energy",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getEnergy
);

// GET /api/v1/analytics/environment
router.get(
  "/environment",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getEnvironment
);

// GET /api/v1/analytics/equipment
router.get(
  "/equipment",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getEquipment
);

// GET /api/v1/analytics/maintenance
router.get(
  "/maintenance",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getMaintenance
);

// GET /api/v1/analytics/alerts
router.get(
  "/alerts",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getAlerts
);

// GET /api/v1/analytics/incidents
router.get(
  "/incidents",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getIncidents
);

// GET /api/v1/analytics/logistics
router.get(
  "/logistics",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getLogistics
);

// GET /api/v1/analytics/stations
router.get(
  "/stations",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: analyticsFilterQuerySchema }),
  analyticsController.getStationComparison
);

export default router;
