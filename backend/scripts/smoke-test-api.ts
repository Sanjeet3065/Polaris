import http from "http";

interface TestCall {
  path: string;
  expectedStatus: number;
  description: string;
  requiresAuth?: boolean;
}

const calls: TestCall[] = [
  { path: "/api/v1/health", expectedStatus: 200, description: "System & Database Health", requiresAuth: false },
  { path: "/api/v1/stations", expectedStatus: 401, description: "Stations API unauthenticated returns 401", requiresAuth: false },
  { path: "/api/v1/stations", expectedStatus: 200, description: "List all Antarctic stations (authenticated)", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI", expectedStatus: 200, description: "Get Maitri station details", requiresAuth: true },
  { path: "/api/v1/stations/BHARATI", expectedStatus: 200, description: "Get Bharati station details", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/telemetry/latest", expectedStatus: 200, description: "Latest telemetry (Maitri)", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/telemetry?page=1&limit=5", expectedStatus: 200, description: "Historical telemetry (paginated)", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/energy/latest", expectedStatus: 200, description: "Latest energy reading (Maitri)", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/energy?page=1&limit=5", expectedStatus: 200, description: "Historical energy (paginated)", requiresAuth: true },
  { path: "/api/v1/stations/BHARATI/environment/latest", expectedStatus: 200, description: "Latest environment reading (Bharati)", requiresAuth: true },
  { path: "/api/v1/stations/BHARATI/environment?page=1&limit=5", expectedStatus: 200, description: "Historical environment (paginated)", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/equipment", expectedStatus: 200, description: "Station equipment catalog", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/alerts", expectedStatus: 200, description: "Station active & acknowledged alerts", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/events", expectedStatus: 200, description: "Station operational events timeline", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/inventory", expectedStatus: 200, description: "Station logistics inventory", requiresAuth: true },
  { path: "/api/v1/stations/MAITRI/maintenance", expectedStatus: 200, description: "Station equipment maintenance work orders", requiresAuth: true },
  { path: "/api/v1/stations/INVALID_STATION_CODE", expectedStatus: 404, description: "Non-existent station returns 404", requiresAuth: true }
];

async function loginForToken(): Promise<string> {
  const res = await fetch("http://127.0.0.1:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@polaris.local", password: "Polaris@Admin2026!" })
  });
  if (!res.ok) {
    throw new Error(`Login failed with status ${res.status}`);
  }
  const data = (await res.json()) as any;
  return data.data.accessToken;
}

async function runSmokeTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 2 & 3: Live HTTP REST API Smoke Tests");
  console.log("Target: http://127.0.0.1:5000");
  console.log("=================================================\n");

  const authToken = await loginForToken();
  let passed = 0;
  let failed = 0;

  for (const c of calls) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (c.requiresAuth) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`http://127.0.0.1:5000${c.path}`, { headers });
      const isSuccess = res.status === c.expectedStatus;
      if (isSuccess) {
        passed++;
        console.log(`  ✔ [${res.status}] PASS: ${c.description} -> ${c.path}`);
      } else {
        failed++;
        console.error(
          `  ❌ [${res.status}] FAIL: ${c.description} (expected ${c.expectedStatus}) -> ${c.path}`
        );
      }
    } catch (err: any) {
      failed++;
      console.error(`  ❌ ERROR calling ${c.path}: ${err.message}`);
    }
  }

  console.log("\n=================================================");
  console.log(`Smoke Test Summary: ${passed}/${calls.length} Passed (${failed} Failed)`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
