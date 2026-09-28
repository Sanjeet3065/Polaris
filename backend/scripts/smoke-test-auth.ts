/**
 * POLARIS Phase 3: Comprehensive Authentication & RBAC HTTP Smoke Test Suite
 * Tests actual HTTP requests against live server at http://localhost:5000
 */

const BASE_URL = "http://localhost:5000/api/v1";

interface SmokeReport {
  step: string;
  passed: boolean;
  status?: number;
  details?: string;
}

const reports: SmokeReport[] = [];

async function smokeTest(step: string, fn: () => Promise<void>) {
  try {
    await fn();
    reports.push({ step, passed: true });
    console.log(`  ✔ [HTTP PASS] ${step}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    reports.push({ step, passed: false, details: msg });
    console.error(`  ❌ [HTTP FAIL] ${step} -> ${msg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function runSmokeTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 3: Live HTTP Smoke Test Suite");
  console.log("Target Server: http://localhost:5000");
  console.log("=================================================\n");

  let viewerAccessToken = "";
  let viewerRefreshToken = "";
  let operatorAccessToken = "";
  let adminAccessToken = "";
  let adminRefreshToken = "";

  // 1. Health endpoint (public)
  await smokeTest("1. Public /health returns 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, "Expected success: true");
    assert(json.data.status === "healthy", "Expected healthy service status");
  });

  // 2. Protected Phase 2 API rejected without token
  await smokeTest("2. Protected /stations rejects unauthenticated request with 401", async () => {
    const res = await fetch(`${BASE_URL}/stations`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const json = await res.json();
    assert(json.success === false, "Expected success: false");
    assert(json.error.code === "MISSING_TOKEN", `Expected code MISSING_TOKEN, got ${json.error.code}`);
  });

  // 3. Login with wrong password returns 401
  await smokeTest("3. Login with invalid password returns 401 generic error", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@polaris.local", password: "IncorrectPassword123!" })
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const json = await res.json();
    assert(json.error.message === "Invalid email or password", "Generic error message expected");
  });

  // 4. Login with VIEWER credentials succeeds
  await smokeTest("4. Login as VIEWER succeeds and returns JWT accessToken", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "viewer@polaris.local", password: "Polaris@Viewer2026!" })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, "Expected success: true");
    assert(typeof json.data.accessToken === "string", "Expected string accessToken");
    assert(json.data.user.role === "VIEWER", "Expected user role VIEWER");

    viewerAccessToken = json.data.accessToken;

    // Check Set-Cookie header for refresh token
    const setCookie = res.headers.get("set-cookie") || "";
    assert(setCookie.includes("polaris_refresh_token"), "Expected polaris_refresh_token cookie");
    assert(setCookie.includes("HttpOnly"), "Cookie must have HttpOnly flag");

    const match = setCookie.match(/polaris_refresh_token=([^;]+)/);
    if (match) viewerRefreshToken = match[1];
  });

  // 5. GET /auth/me with VIEWER token
  await smokeTest("5. GET /auth/me with VIEWER token returns user profile", async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${viewerAccessToken}` }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data.email === "viewer@polaris.local", "Email matches");
    assert(json.data.role === "VIEWER", "Role matches VIEWER");
    assert(!("passwordHash" in json.data), "passwordHash must not leak");
  });

  // 6. GET /stations with VIEWER token succeeds (Read-only access permitted)
  await smokeTest("6. VIEWER can access protected Phase 2 /stations list", async () => {
    const res = await fetch(`${BASE_URL}/stations`, {
      headers: { Authorization: `Bearer ${viewerAccessToken}` }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.data), "Expected array of stations");
    assert(json.data.length >= 2, "Expected Maitri and Bharati");
  });

  // 7. GET /auth/users with VIEWER token is rejected with 403 Forbidden
  await smokeTest("7. VIEWER is forbidden (403) from accessing admin user management", async () => {
    const res = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${viewerAccessToken}` }
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
    const json = await res.json();
    assert(json.error.code === "FORBIDDEN_INSUFFICIENT_ROLE", `Expected FORBIDDEN_INSUFFICIENT_ROLE, got ${json.error.code}`);
  });

  // 8. Login as OPERATOR succeeds
  await smokeTest("8. Login as OPERATOR succeeds", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "operator@polaris.local", password: "Polaris@Operator2026!" })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data.user.role === "OPERATOR", "Role matches OPERATOR");
    operatorAccessToken = json.data.accessToken;
  });

  // 9. OPERATOR can access telemetry
  await smokeTest("9. OPERATOR can access station telemetry API", async () => {
    const res = await fetch(`${BASE_URL}/stations/MAITRI/telemetry`, {
      headers: { Authorization: `Bearer ${operatorAccessToken}` }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, "Expected telemetry data");
  });

  // 10. OPERATOR is forbidden (403) from accessing admin user management
  await smokeTest("10. OPERATOR is forbidden (403) from accessing admin user management", async () => {
    const res = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${operatorAccessToken}` }
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // 11. Login as ADMIN succeeds
  await smokeTest("11. Login as ADMIN succeeds and returns ADMIN claims", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@polaris.local", password: "Polaris@Admin2026!" })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data.user.role === "ADMIN", "Role matches ADMIN");
    adminAccessToken = json.data.accessToken;

    const setCookie = res.headers.get("set-cookie") || "";
    const match = setCookie.match(/polaris_refresh_token=([^;]+)/);
    if (match) adminRefreshToken = match[1];
  });

  // 12. ADMIN can access user management API
  await smokeTest("12. ADMIN can access /auth/users list", async () => {
    const res = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.data), "Expected array of users");
    assert(json.data.length >= 3, "Expected at least 3 users");
  });

  // 13. ADMIN can access audit events
  await smokeTest("13. ADMIN can access /auth/events security audit trail", async () => {
    const res = await fetch(`${BASE_URL}/auth/events`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.data), "Expected array of events");
    assert(json.data.length > 0, "Audit trail contains events");
  });

  // 14. Token refresh rotation works
  let newAdminRefreshToken = "";
  await smokeTest("14. POST /auth/refresh rotates token and returns fresh access token", async () => {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `polaris_refresh_token=${adminRefreshToken}`
      }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(typeof json.data.accessToken === "string", "New access token issued");

    const setCookie = res.headers.get("set-cookie") || "";
    const match = setCookie.match(/polaris_refresh_token=([^;]+)/);
    if (match) newAdminRefreshToken = match[1];
    assert(newAdminRefreshToken !== adminRefreshToken, "Rotated refresh token must differ from old one");
  });

  // 15. Logout clears session
  await smokeTest("15. POST /auth/logout clears session and auth cookie", async () => {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: `polaris_refresh_token=${newAdminRefreshToken}`
      }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data.message === "Successfully logged out", "Logout confirmed");

    const setCookie = res.headers.get("set-cookie") || "";
    assert(
      setCookie.includes("polaris_refresh_token=;") || setCookie.includes("Max-Age=0") || setCookie.includes("Expires="),
      "Cookie must be cleared"
    );
  });

  // 16. Refresh with revoked token fails
  await smokeTest("16. Re-using revoked refresh token fails with 401", async () => {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `polaris_refresh_token=${newAdminRefreshToken}`
      }
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log("\n=================================================");
  const passed = reports.filter((r) => r.passed).length;
  const failed = reports.filter((r) => !r.passed).length;
  console.log(`Live HTTP Smoke Test Summary: ${passed}/${reports.length} Passed (${failed} Failed)`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
