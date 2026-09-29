import { Router } from "express";
import { incidentController } from "../controllers/incident.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  incidentQuerySchema,
  createIncidentSchema,
  updateIncidentSchema,
  updateIncidentStatusSchema,
  assignIncidentSchema,
  incidentNoteSchema,
  linkAlertSchema
} from "../validators/alert.validator";
import { UserRole } from "@prisma/client";

const router = Router();

// All incident endpoints require authentication
router.use(authenticate);

// GET /api/v1/incidents/overview
router.get("/overview", incidentController.getIncidentsOverview);

// GET /api/v1/incidents
router.get(
  "/",
  validateRequest({ query: incidentQuerySchema }),
  incidentController.getIncidents
);

// GET /api/v1/incidents/:id/timeline
router.get("/:id/timeline", incidentController.getIncidentTimeline);

// GET /api/v1/incidents/:id
router.get("/:id", incidentController.getIncidentById);

// POST /api/v1/incidents
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: createIncidentSchema }),
  incidentController.createIncident
);

// PATCH /api/v1/incidents/:id
router.patch(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: updateIncidentSchema }),
  incidentController.updateIncident
);

// POST /api/v1/incidents/:id/status
router.post(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: updateIncidentStatusSchema }),
  incidentController.updateIncidentStatus
);

// POST /api/v1/incidents/:id/assign
router.post(
  "/:id/assign",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: assignIncidentSchema }),
  incidentController.assignIncident
);

// POST /api/v1/incidents/:id/notes
router.post(
  "/:id/notes",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: incidentNoteSchema }),
  incidentController.addIncidentNote
);

// POST /api/v1/incidents/:id/alerts
router.post(
  "/:id/alerts",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  validateRequest({ body: linkAlertSchema }),
  incidentController.linkAlert
);

// DELETE /api/v1/incidents/:id/alerts/:alertId
router.delete(
  "/:id/alerts/:alertId",
  authorize(UserRole.ADMIN, UserRole.OPERATOR),
  incidentController.unlinkAlert
);

export default router;
