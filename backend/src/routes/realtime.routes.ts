import { Router, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { realtimeService } from "../realtime/realtime.service";
import { ApiResponse } from "../utils/apiResponse";

const router = Router();

/**
 * GET /api/v1/system/realtime
 * Exposes live WebSocket subsystem metrics (Section 36)
 * Protected: ADMIN, OPERATOR, VIEWER
 */
router.get(
  "/realtime",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  (req: Request, res: Response) => {
    const metrics = realtimeService.getMetrics();
    ApiResponse.success(res, metrics, 200);
  }
);

export default router;
