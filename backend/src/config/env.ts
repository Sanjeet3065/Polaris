import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z
    .string()
    .default("postgresql://polaris_admin:polaris_secure_password@localhost:5432/polaris_db?schema=public"),
  JWT_SECRET: z.string().default("polaris_default_jwt_secret_phase0"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_SECRET: z.string().default("polaris_default_refresh_secret_phase0"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  SOCKET_URL: z.string().default("http://localhost:5000")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables configuration:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export type EnvConfig = z.infer<typeof envSchema>;
