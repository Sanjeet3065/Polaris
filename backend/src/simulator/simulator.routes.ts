import { Router } from "express";
import { UserRole } from "@prisma/client";
import { simulatorController } from "./simulator.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  startSimulatorSchema,
  startScenarioSchema,
  stopScenarioSchema,
  manualTickSchema
} from "./validators/simulator.validator";

const router = Router();

// ============================================================
// SIMULATOR LIFECYCLE & STATUS APIS
// ============================================================

// GET /api/v1/simulator/status (All roles can observe telemetry status)
router.get(
  "/status",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  simulatorController.getStatus
);

// POST /api/v1/simulator/start (ADMIN & OPERATOR)
router.post(
  "/start",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: startSimulatorSchema }),
  simulatorController.start
);

// POST /api/v1/simulator/stop (ADMIN & OPERATOR)
router.post(
  "/stop",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  simulatorController.stop
);

// POST /api/v1/simulator/restart (ADMIN & OPERATOR)
router.post(
  "/restart",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: startSimulatorSchema }),
  simulatorController.restart
);

// ============================================================
// SCENARIO MANAGEMENT APIS
// ============================================================

// GET /api/v1/simulator/scenarios (All roles)
router.get(
  "/scenarios",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  simulatorController.getScenarios
);

// POST /api/v1/simulator/scenarios/start (ADMIN & OPERATOR)
router.post(
  "/scenarios/start",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: startScenarioSchema }),
  simulatorController.startScenario
);

// POST /api/v1/simulator/scenarios/stop (ADMIN & OPERATOR)
router.post(
  "/scenarios/stop",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: stopScenarioSchema }),
  simulatorController.stopScenario
);

// ============================================================
// MANUAL SIMULATION TICK (FOR TESTING & DEVELOPMENT)
// ============================================================

// POST /api/v1/simulator/tick (ADMIN & OPERATOR)
router.post(
  "/tick",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: manualTickSchema }),
  simulatorController.manualTick
);

export default router;
