import { Prisma } from "@prisma/client";
import { ApiError } from "./apiError";
import { logger } from "./logger";

/**
 * Maps known Prisma and database client errors into standard API errors
 */
export function handleDbError(error: unknown, resourceName = "Resource"): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      // Record not found
      case "P2001":
      case "P2025":
        throw ApiError.notFound(`${resourceName} was not found`, "RECORD_NOT_FOUND");

      // Unique constraint violation
      case "P2002": {
        const target = (error.meta?.target as string[])?.join(", ") || "field";
        throw ApiError.conflict(
          `Unique constraint violation: ${resourceName} with this ${target} already exists`,
          "DUPLICATE_RESOURCE"
        );
      }

      // Foreign key constraint violation
      case "P2003":
        throw ApiError.badRequest(
          `Foreign key constraint violation on ${resourceName}`,
          "FOREIGN_KEY_VIOLATION"
        );

      // Connection timeout / Database unreachable
      case "P2024":
      case "P1001":
      case "P1002":
        logger.error("Database connection failure:", error);
        throw ApiError.internal(
          "Database service is temporarily unavailable",
          "DATABASE_UNAVAILABLE"
        );

      default:
        logger.error(`Unhandled Prisma error [${error.code}]:`, error);
        throw ApiError.internal("Database operation failed", "DATABASE_ERROR");
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.warn("Prisma validation error", { message: error.message });
    throw ApiError.badRequest("Invalid database query parameters", "DB_VALIDATION_ERROR");
  }

  if (error instanceof ApiError) {
    throw error;
  }

  logger.error("Unexpected repository error", error instanceof Error ? error : undefined);
  throw ApiError.internal("An unexpected data layer error occurred", "DATA_LAYER_ERROR");
}
