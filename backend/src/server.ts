import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { webSocketManager } from "./websocket/socketHandler";
import { simulatorService } from "./simulator/simulator.service";

const startServer = (): void => {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize WebSocket architecture hook
  webSocketManager.initialize(server);

  server.listen(env.PORT, env.HOST, async () => {
    logger.info("POLARIS Backend Server initialized successfully", {
      port: env.PORT,
      host: env.HOST,
      environment: env.NODE_ENV,
      healthEndpoint: `http://${env.HOST}:${env.PORT}/api/v1/health`
    });

    if (env.SIMULATOR_ENABLED) {
      logger.info("Auto-starting POLARIS sensor simulator as configured in env");
      await simulatorService.start({
        intervalMs: env.SIMULATOR_INTERVAL_MS,
        noiseLevel: env.SIMULATOR_NOISE_LEVEL
      });
    }
  });

  // Graceful Shutdown Signals
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down POLARIS backend gracefully...`);
    simulatorService.stop();
    const { disconnectPrisma } = await import("./config/prisma");
    await disconnectPrisma();
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });

    // Force exit if hanging after 10s
    setTimeout(() => {
      logger.error("Forceful shutdown after timeout", undefined, { signal });
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error("Unhandled Promise Rejection", reason instanceof Error ? reason : new Error(String(reason)));
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception", error);
    process.exit(1);
  });
};

startServer();
