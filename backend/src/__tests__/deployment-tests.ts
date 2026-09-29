import fs from "fs";
import path from "path";
import { prisma } from "../config/prisma";
import { healthService } from "../services/health.service";
import { AIProviderFactory } from "../services/assistant/aiProviders/providerFactory";
import { AiClientService } from "../services/aiClient.service";
import { logger } from "../utils/logger";
import { UserRole } from "@prisma/client";

interface TestReport {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestReport[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✔ PASS: ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  ❌ FAIL: ${name} -> ${errorMsg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

export async function runDeploymentTests(): Promise<{ passed: number; total: number; failed: number }> {
  console.log("\n=================================================");
  console.log("POLARIS Phase 15: Docker & Production Deployment Verification Suite");
  console.log("Auditing: Environment, Container Assets, Health Checks, Secrets & Resilience");
  console.log("=================================================\n");

  // ------------------------------------------------------------
  // Group 1: Health Probes & Observability
  // ------------------------------------------------------------
  console.log("--- Group 1: Health Probes & Production Observability ---");

  await test("DEP-01: Health service returns healthy state with DB latency", async () => {
    const health = await healthService.getSystemHealth();
    assert(health.service === "polaris-backend", "Expected service name to be polaris-backend");
    assert(health.status === "healthy" || health.status === "degraded", "Expected valid health status");
    assert(health.database.status === "UP", "Expected database status UP");
    assert(typeof health.database.latencyMs === "number", "Expected numeric latency");
  });

  await test("DEP-02: Health check payload does NOT leak credentials, secrets, or internal paths", async () => {
    const health = await healthService.getSystemHealth();
    const str = JSON.stringify(health);
    assert(!str.includes("password"), "Health check must not contain password");
    assert(!str.includes("secret"), "Health check must not contain secret");
    assert(!str.includes("C:\\"), "Health check must not contain local Windows paths");
    assert(!str.includes("/Users/"), "Health check must not contain user directories");
  });

  await test("DEP-03: Structured logger redacts sensitive authorization tokens and passwords", async () => {
    let captured = "";
    const originalStdout = process.stdout.write;
    process.stdout.write = ((chunk: any) => {
      captured += String(chunk);
      return true;
    }) as any;

    try {
      logger.info("Production security check", {
        password: "SensitivePassword123!",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
        safeData: "PolarStationOperational"
      });
    } finally {
      process.stdout.write = originalStdout;
    }

    assert(captured.includes("[REDACTED]"), "Expected sensitive fields to be redacted in log output");
    assert(!captured.includes("SensitivePassword123!"), "Plaintext password must not be logged");
  });

  // ------------------------------------------------------------
  // Group 2: Resilience & Fallback Architecture
  // ------------------------------------------------------------
  console.log("\n--- Group 2: Resilience & Microservice Fallback ---");

  await test("DEP-04: AIProviderFactory defaults safely to deterministic engine without credentials", async () => {
    AIProviderFactory.resetProvider();
    const originalProvider = process.env.AI_PROVIDER;
    const originalKey = process.env.AI_API_KEY;

    try {
      delete process.env.AI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      process.env.AI_PROVIDER = "deterministic";

      const provider = AIProviderFactory.getProvider();
      assert(provider !== null, "Expected provider instance");
      assert(provider.name === "DeterministicAiProvider", `Expected DeterministicAiProvider, got ${provider.name}`);
    } finally {
      process.env.AI_PROVIDER = originalProvider;
      if (originalKey) process.env.AI_API_KEY = originalKey;
      AIProviderFactory.resetProvider();
    }
  });

  await test("DEP-05: AI Client Service falls back gracefully when prediction daemon is unavailable", async () => {
    const aiClient = AiClientService.getInstance();
    const fallbackResult = aiClient.computeInProcessFallback({
      equipmentId: "test-eq-1",
      equipmentCode: "MAITRI-GEN-01",
      stationCode: "MAITRI",
      featureVector: {
        runtimeHours: 4500,
        temperature: 68.5,
        vibration: 2.1,
        ambientTemp: -24.0,
        loadPercent: 78.0,
        maintenanceAgeDays: 45,
        pressure: 980
      }
    });

    assert(fallbackResult.isFallback === true, "Expected isFallback to be true");
    assert(typeof fallbackResult.healthScore === "number", "Expected numeric health score");
    assert(fallbackResult.healthScore >= 0 && fallbackResult.healthScore <= 100, "Expected valid score range");
    assert(fallbackResult.modelName.toLowerCase().includes("fallback"), "Expected model name to indicate fallback");
  });

  // ------------------------------------------------------------
  // Group 3: Database Integrity & Seeded Role Verification
  // ------------------------------------------------------------
  console.log("\n--- Group 3: Database Migration & User Integrity ---");

  await test("DEP-06: Database contains both operational Antarctic stations (Maitri & Bharati)", async () => {
    const stations = await prisma.station.findMany({
      where: { code: { in: ["MAITRI", "BHARATI"] } }
    });
    assert(stations.length === 2, `Expected 2 stations, found ${stations.length}`);
    const maitri = stations.find((s) => s.code === "MAITRI");
    const bharati = stations.find((s) => s.code === "BHARATI");
    assert(maitri !== undefined, "Expected Maitri station in database");
    assert(bharati !== undefined, "Expected Bharati station in database");
  });

  await test("DEP-07: Seeded administrative, operator, and viewer roles exist in database", async () => {
    const users = await prisma.user.findMany({
      where: {
        email: { in: ["admin@polaris.local", "operator@polaris.local", "viewer@polaris.local"] }
      }
    });
    assert(users.length === 3, `Expected 3 default users, found ${users.length}`);

    const admin = users.find((u) => u.email === "admin@polaris.local");
    const operator = users.find((u) => u.email === "operator@polaris.local");
    const viewer = users.find((u) => u.email === "viewer@polaris.local");

    assert(admin?.role === UserRole.ADMIN, "Expected ADMIN role for admin user");
    assert(operator?.role === UserRole.OPERATOR, "Expected OPERATOR role for operator user");
    assert(viewer?.role === UserRole.VIEWER, "Expected VIEWER role for viewer user");
  });

  await test("DEP-08: User passwords in database are securely hashed (Argon2id)", async () => {
    const users = await prisma.user.findMany({
      where: {
        email: { in: ["admin@polaris.local", "operator@polaris.local", "viewer@polaris.local"] }
      }
    });

    for (const u of users) {
      assert(u.passwordHash.startsWith("$argon2id$"), `Password hash for ${u.email} must use argon2id`);
      assert(!u.passwordHash.includes("Polaris@"), "Plaintext password must not be stored in database");
    }
  });

  // ------------------------------------------------------------
  // Group 4: Container Artifacts & Docker Configuration
  // ------------------------------------------------------------
  console.log("\n--- Group 4: Container Artifacts & Docker Configurations ---");

  const rootDir = path.resolve(__dirname, "../../..");

  await test("DEP-09: Backend Dockerfile contains multi-stage build, dumb-init and non-root user", async () => {
    const dockerfilePath = path.join(rootDir, "docker/Dockerfile.backend");
    assert(fs.existsSync(dockerfilePath), "docker/Dockerfile.backend must exist");
    const content = fs.readFileSync(dockerfilePath, "utf-8");

    assert(content.includes("FROM node:20-alpine AS builder"), "Must contain builder stage");
    assert(content.includes("FROM node:20-alpine AS runner"), "Must contain runner stage");
    assert(content.includes("USER node"), "Must run as unprivileged node user");
    assert(content.includes("dumb-init"), "Must include dumb-init for PID 1 signal forwarding");
    assert(content.includes("HEALTHCHECK"), "Must include container healthcheck");
    assert(content.includes("prisma generate"), "Must generate Prisma client");
  });

  await test("DEP-10: Frontend Dockerfile contains Nginx, SPA fallback and health probe", async () => {
    const dockerfilePath = path.join(rootDir, "docker/Dockerfile.frontend");
    const nginxConfPath = path.join(rootDir, "docker/nginx.conf");

    assert(fs.existsSync(dockerfilePath), "docker/Dockerfile.frontend must exist");
    assert(fs.existsSync(nginxConfPath), "docker/nginx.conf must exist");

    const nginxContent = fs.readFileSync(nginxConfPath, "utf-8");
    assert(nginxContent.includes("try_files $uri $uri/ /index.html;"), "Nginx config must contain SPA routing fallback");
    assert(nginxContent.includes("gzip on;"), "Nginx config must enable gzip compression");
    assert(nginxContent.includes("/health"), "Nginx config must include /health endpoint");
  });

  await test("DEP-11: AI Service Dockerfile contains non-root user and healthcheck", async () => {
    const dockerfilePath = path.join(rootDir, "docker/Dockerfile.ai");
    assert(fs.existsSync(dockerfilePath), "docker/Dockerfile.ai must exist");
    const content = fs.readFileSync(dockerfilePath, "utf-8");

    assert(content.includes("FROM python:3.11-slim"), "Must use Python 3.11 base image");
    assert(content.includes("USER appuser"), "Must run as unprivileged appuser");
    assert(content.includes("HEALTHCHECK"), "Must contain container healthcheck");
    assert(content.includes("uvicorn"), "Must run via uvicorn ASGI server");
  });

  await test("DEP-12: Docker Compose specifies persistent PostgreSQL named volume and service networks", async () => {
    const composePath = path.join(rootDir, "docker-compose.yml");
    assert(fs.existsSync(composePath), "docker-compose.yml must exist");
    const content = fs.readFileSync(composePath, "utf-8");

    assert(content.includes("postgres:"), "Must declare postgres service");
    assert(content.includes("backend:"), "Must declare backend service");
    assert(content.includes("ai-service:"), "Must declare ai-service");
    assert(content.includes("frontend:"), "Must declare frontend service");
    assert(content.includes("postgres_data:"), "Must declare persistent postgres volume");
    assert(content.includes("polaris_network"), "Must define polaris_network bridge");
  });

  await test("DEP-13: Production Docker Compose (docker-compose.prod.yml) enforces mandatory secrets", async () => {
    const prodComposePath = path.join(rootDir, "docker-compose.prod.yml");
    assert(fs.existsSync(prodComposePath), "docker-compose.prod.yml must exist");
    const content = fs.readFileSync(prodComposePath, "utf-8");

    assert(content.includes("restart: always"), "Must specify restart always in production");
    assert(content.includes("JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:?"), "Must enforce JWT_ACCESS_SECRET");
    assert(content.includes("POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?"), "Must enforce POSTGRES_PASSWORD");
  });

  // ------------------------------------------------------------
  // Group 5: Environment Files & Secret Leaks Audit
  // ------------------------------------------------------------
  console.log("\n--- Group 5: Environment Files & Secret Leakage Audit ---");

  await test("DEP-14: Root, Backend, AI Service, and Frontend .env.example templates exist", async () => {
    assert(fs.existsSync(path.join(rootDir, ".env.example")), "Root .env.example must exist");
    assert(fs.existsSync(path.join(rootDir, "backend/.env.example")), "backend/.env.example must exist");
    assert(fs.existsSync(path.join(rootDir, "frontend/.env.example")), "frontend/.env.example must exist");
    assert(fs.existsSync(path.join(rootDir, "ai-service/.env.example")), "ai-service/.env.example must exist");
  });

  await test("DEP-15: Frontend .env.example and public variables contain ZERO database or secret keys", async () => {
    const frontendEnv = fs.readFileSync(path.join(rootDir, "frontend/.env.example"), "utf-8");
    assert(!frontendEnv.includes("DATABASE_URL"), "Frontend must never reference DATABASE_URL");
    assert(!frontendEnv.includes("JWT_ACCESS_SECRET"), "Frontend must never reference JWT secrets");
    assert(!frontendEnv.includes("AI_API_KEY"), "Frontend must never reference AI_API_KEY");
  });

  await test("DEP-16: .gitignore properly excludes all .env, .local, and .vercel directories", async () => {
    const gitignorePath = path.join(rootDir, ".gitignore");
    const content = fs.readFileSync(gitignorePath, "utf-8");
    assert(content.includes(".env"), ".gitignore must exclude .env");
    assert(content.includes(".env.local"), ".gitignore must exclude .env.local");
    assert(content.includes(".vercel/"), ".gitignore must exclude .vercel/");
  });

  // Summary
  console.log("\n=================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Phase 15 Deployment Tests Summary: ${passed}/${total} Passed (${failed} Failed)`);
  console.log("=================================================\n");

  if (failed > 0) {
    throw new Error(`Phase 15 deployment tests failed: ${failed}/${total}`);
  }

  return { passed, total, failed };
}
