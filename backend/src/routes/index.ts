import { Router } from "express";
import healthRoutes from "./health.routes";
import stationRoutes from "./station.routes";

const router = Router();

// Mount Health Check endpoint
router.use("/health", healthRoutes);

// Mount Stations Data APIs
router.use("/stations", stationRoutes);

export default router;

