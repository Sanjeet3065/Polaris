import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  exportReportQuerySchema,
  generateReportBodySchema,
  reportIdParamSchema
} from "../validators/analytics.validator";
import { UserRole } from "@prisma/client";

const router = Router();

// Protect all report endpoints with JWT authentication & RBAC
router.use(authenticate);

// GET /api/v1/reports/types
router.get(
  "/types",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  reportController.getReportTypes
);

// GET /api/v1/reports
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  reportController.getReports
);

// POST /api/v1/reports/generate (Restricted to ADMIN, OPERATOR)
router.post(
  "/generate",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: generateReportBodySchema }),
  reportController.generateReport
);

// GET /api/v1/reports/:reportId
router.get(
  "/:reportId",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ params: reportIdParamSchema }),
  reportController.getReportById
);

// GET /api/v1/reports/:reportId/export
router.get(
  "/:reportId/export",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({
    params: reportIdParamSchema,
    query: exportReportQuerySchema
  }),
  reportController.exportReport
);

export default router;
