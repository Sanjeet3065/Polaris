import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"]?.toString() || Math.random().toString(36).substring(2, 10);

  // Attach requestId to request context for traceability
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP Request Completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get("user-agent")
    });
  });

  next();
};
