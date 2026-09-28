import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import apiRoutes from "./routes";

export const createApp = (): Application => {
  const app: Application = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false
    })
  );

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
    })
  );

  // Body Parsing Middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request Auditing & Logging
  app.use(requestLogger);

  // Primary API Router (v1)
  app.use("/api/v1", apiRoutes);

  // Root Welcome & Architecture Info
  app.get("/", (req, res) => {
    res.json({
      project: "POLARIS",
      fullName: "Polar Operations & Logistics Automated Remote Intelligence System",
      description: "Digital Twin for Smarter Antarctic Station Management",
      organization: "MoES / NCPOR (SIH 2026 - Problem ID: SIH26060)",
      version: "0.1.0",
      status: "Phase 0 Architecture Active",
      healthCheck: "/api/v1/health"
    });
  });

  // 404 Handler for undefined routes
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
