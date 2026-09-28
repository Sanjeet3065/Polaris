import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { validateRequest } from "../middleware/validateRequest";
import { stationIdParamSchema, eventQuerySchema } from "../validators/station.validator";

const router = Router({ mergeParams: true });

// GET /api/v1/stations/:stationId/events
router.get(
  "/",
  validateRequest({
    params: stationIdParamSchema,
    query: eventQuerySchema
  }),
  eventController.getStationEvents
);

export default router;
