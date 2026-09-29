/**
 * POLARIS — SIH Demo Mode Routes
 * Phase 16: Endpoints for controlling the scripted SIH evaluation demo
 */

import { Router } from "express";
import { UserRole } from "@prisma/client";
import { demoController } from "../controllers/demo.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// GET /api/v1/demo/status (All roles can observe demo status)
router.get(
  "/status",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  demoController.getStatus
);

// POST /api/v1/demo/start (ADMIN & OPERATOR)
router.post(
  "/start",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  demoController.start
);

// POST /api/v1/demo/stop (ADMIN & OPERATOR)
router.post(
  "/stop",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  demoController.stop
);

export default router;
