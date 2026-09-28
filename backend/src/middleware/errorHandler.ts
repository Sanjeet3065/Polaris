import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const requestId = req.headers["x-request-id"]?.toString();

  // Handle known operational API errors
  if (err instanceof ApiError) {
    logger.warn(`Operational Error: ${err.message}`, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.originalUrl
    });

    ApiResponse.error(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message
    }));

    logger.warn("Validation Error", {
      requestId,
      errors: formattedErrors,
      path: req.originalUrl
    });

    ApiResponse.error(
      res,
      "VALIDATION_ERROR",
      "Request data validation failed",
      400,
      formattedErrors
    );
    return;
  }

  // Handle unknown/unexpected system errors (never leak stack trace in production)
  logger.error("Unhandled Server Exception", err, {
    requestId,
    path: req.originalUrl,
    method: req.method
  });

  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred"
      : err.message || "Internal server error";

  ApiResponse.error(res, "INTERNAL_SERVER_ERROR", message, 500);
};
