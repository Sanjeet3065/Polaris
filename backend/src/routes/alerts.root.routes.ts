import { Router } from "express";
import { alertController } from "../controllers/alert.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  alertQuerySchema,
  createAlertSchema,
  acknowledgeAlertSchema,
  escalateAlertSchema,
  resolveAlertSchema,
  suppressAlertSchema
} from "../validators/alert.validator";
import { UserRole } from "@prisma/client";

const router = Router();

// All alert endpoints require authentication
router.use(authenticate);

// GET /api/v1/alerts/overview
router.get("/overview", alertController.getAlertsOverview);

// GET /api/v1/alerts
router.get(
  "/",
  validateRequest({ query: alertQuerySchema }),
  alertController.getAlerts
);

// GET /api/v1/alerts/:id/timeline
router.get("/:id/timeline", alertController.getAlertTimeline);

// GET /api/v1/alerts/:id
router.get("/:id", alertController.getAlertById);

// POST /api/v1/alerts (Manual or operational alert creation)
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: createAlertSchema }),
  alertController.createAlert
);

// POST /api/v1/alerts/:id/acknowledge
router.post(
  "/:id/acknowledge",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: acknowledgeAlertSchema }),
  alertController.acknowledgeAlert
);

// POST /api/v1/alerts/:id/escalate
router.post(
  "/:id/escalate",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: escalateAlertSchema }),
  alertController.escalateAlert
);

// POST /api/v1/alerts/:id/resolve
router.post(
  "/:id/resolve",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: resolveAlertSchema }),
  alertController.resolveAlert
);

// POST /api/v1/alerts/:id/suppress
router.post(
  "/:id/suppress",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: suppressAlertSchema }),
  alertController.suppressAlert
);

export default router;
