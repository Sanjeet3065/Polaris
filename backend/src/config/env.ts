import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from .env if present (supporting both monorepo root and backend dir)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z
    .string()
    .default("postgresql://polaris_admin:polaris_secure_password@localhost:5432/polaris_db?schema=public"),
  JWT_ACCESS_SECRET: z.string().default(process.env.JWT_SECRET || "polaris_super_secret_jwt_access_key_2026"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().default("polaris_super_secret_refresh_token_key_change_in_production_2026"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  AUTH_COOKIE_SECURE: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@polaris.local"),
  SEED_ADMIN_PASSWORD: z.string().default("Polaris@Admin2026!"),
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  SOCKET_URL: z.string().default("http://localhost:5000"),
  SIMULATOR_ENABLED: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  SIMULATOR_INTERVAL_MS: z.coerce.number().min(500).max(3600000).default(5000),
  SIMULATOR_NOISE_LEVEL: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  SIMULATOR_DEFAULT_SCENARIO: z.string().default("NORMAL"),
  WEBSOCKET_ENABLED: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  WEBSOCKET_HEARTBEAT_INTERVAL_MS: z.coerce.number().min(1000).max(300000).default(30000),
  WEBSOCKET_CONNECTION_TIMEOUT_MS: z.coerce.number().min(2000).max(600000).default(60000),
  WEBSOCKET_MAX_CONNECTIONS: z.coerce.number().min(1).max(10000).default(100),
  WEBSOCKET_MAX_MESSAGE_SIZE: z.coerce.number().min(1024).max(1048576).default(65536)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables configuration:", parsedEnv.error.format());
  process.exit(1);
}

// Ensure process.env has DATABASE_URL for Prisma runtime
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = parsedEnv.data.DATABASE_URL;
}

export const env = parsedEnv.data;
export type EnvConfig = z.infer<typeof envSchema>;
