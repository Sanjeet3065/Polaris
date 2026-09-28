import http from "http";

interface TestCall {
  path: string;
  expectedStatus: number;
  description: string;
}

const calls: TestCall[] = [
  { path: "/api/v1/health", expectedStatus: 200, description: "System & Database Health" },
  { path: "/api/v1/stations", expectedStatus: 200, description: "List all Antarctic stations" },
  { path: "/api/v1/stations/MAITRI", expectedStatus: 200, description: "Get Maitri station details" },
  { path: "/api/v1/stations/BHARATI", expectedStatus: 200, description: "Get Bharati station details" },
  { path: "/api/v1/stations/MAITRI/telemetry/latest", expectedStatus: 200, description: "Latest telemetry (Maitri)" },
  { path: "/api/v1/stations/MAITRI/telemetry?page=1&limit=5", expectedStatus: 200, description: "Historical telemetry (paginated)" },
  { path: "/api/v1/stations/MAITRI/energy/latest", expectedStatus: 200, description: "Latest energy reading (Maitri)" },
  { path: "/api/v1/stations/MAITRI/energy?page=1&limit=5", expectedStatus: 200, description: "Historical energy (paginated)" },
  { path: "/api/v1/stations/BHARATI/environment/latest", expectedStatus: 200, description: "Latest environment reading (Bharati)" },
  { path: "/api/v1/stations/BHARATI/environment?page=1&limit=5", expectedStatus: 200, description: "Historical environment (paginated)" },
  { path: "/api/v1/stations/MAITRI/equipment", expectedStatus: 200, description: "Station equipment catalog" },
  { path: "/api/v1/stations/MAITRI/alerts", expectedStatus: 200, description: "Station active & acknowledged alerts" },
  { path: "/api/v1/stations/MAITRI/events", expectedStatus: 200, description: "Station operational events timeline" },
  { path: "/api/v1/stations/MAITRI/inventory", expectedStatus: 200, description: "Station logistics inventory" },
  { path: "/api/v1/stations/MAITRI/maintenance", expectedStatus: 200, description: "Station equipment maintenance work orders" },
  { path: "/api/v1/stations/INVALID_STATION_CODE", expectedStatus: 404, description: "Non-existent station returns 404" }
];

function makeRequest(path: string): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port: 5000,
        path,
        headers: { "Content-Type": "application/json" }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(raw);
            resolve({ statusCode: res.statusCode || 0, data });
          } catch {
            resolve({ statusCode: res.statusCode || 0, data: raw });
          }
        });
      }
    );
    req.on("error", reject);
  });
}

async function runSmokeTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 2: Live HTTP REST API Smoke Tests");
  console.log("Target: http://127.0.0.1:5000");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  for (const c of calls) {
    try {
      const res = await makeRequest(c.path);
      const isSuccess = res.statusCode === c.expectedStatus;
      if (isSuccess) {
        passed++;
        console.log(`  ✔ [${res.statusCode}] PASS: ${c.description} -> ${c.path}`);
        if (c.path === "/api/v1/health") {
          console.log(`    DB Status: ${res.data?.data?.database?.status}, Latency: ${res.data?.data?.database?.latencyMs}ms`);
        }
      } else {
        failed++;
        console.error(
          `  ❌ [${res.statusCode}] FAIL: ${c.description} (expected ${c.expectedStatus}) -> ${c.path}`
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

runSmokeTests();
