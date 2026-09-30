import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { healthController } from "./controllers/health.controller";
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
  const configuredOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow server-to-server or non-browser tools (no origin)
        if (!requestOrigin) return callback(null, true);
        if (env.CORS_ORIGIN === "*") return callback(null, true);

        // Check if origin matches configured list or *.vercel.app domain
        const isAllowed =
          configuredOrigins.includes(requestOrigin) ||
          requestOrigin.endsWith(".vercel.app") ||
          requestOrigin.includes("localhost") ||
          requestOrigin.includes("127.0.0.1");

        if (isAllowed) {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy blocked access from origin: ${requestOrigin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
    })
  );

  // Body and Cookie Parsing Middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Request Auditing & Logging
  app.use(requestLogger);

  // Primary API Router (v1)
  app.use("/api/v1", apiRoutes);

  // Root Health Probe (compatible with container orchestrators)
  app.get("/health", healthController.getHealth);

  // Root Welcome & Architecture Info
  app.get("/", (req, res) => {
    res.json({
      project: "POLARIS",
      fullName: "Polar Operations & Logistics Automated Remote Intelligence System",
      description: "Digital Twin for Smarter Antarctic Station Management",
      organization: "Ministry of Earth Sciences (MoES) / NCPOR",
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
