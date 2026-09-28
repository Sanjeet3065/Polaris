import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __polaris_prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__polaris_prisma__ ||
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "info" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" }
          ]
        : [
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" }
          ]
  });

if (env.NODE_ENV !== "production") {
  globalThis.__polaris_prisma__ = prisma;
}

// Log query events in development if structured logger is active
if (env.NODE_ENV === "development") {
  // @ts-expect-error Prisma event typing for query logger
  prisma.$on("query", (e: { query: string; duration: number; params: string }) => {
    // Redact internal parameters or secrets from logs
    logger.debug(`[Prisma Query (${e.duration}ms)] ${e.query}`);
  });
}

/**
 * Gracefully disconnects Prisma client on application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Prisma client disconnected successfully.");
  } catch (error) {
    logger.error("Error disconnecting Prisma client", error instanceof Error ? error : undefined);
  }
}
