import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { authService } from "../services/auth.service";
import { userAdminService } from "../services/user-admin.service";
import { tokenService } from "../services/token.service";
import { sessionService } from "../services/session.service";
import { PasswordService } from "../utils/password";
import { CryptoUtil } from "../utils/crypto";
import { sanitizeUser } from "../controllers/auth.controller";
import { authorize } from "../middleware/authorize";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";

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

export async function runAuthTests() {
  console.log("=================================================");
  console.log("POLARIS Phase 3: Authentication & RBAC Test Suite");
  console.log("Target: 30+ Rigorous Security & Functional Tests");
  console.log("=================================================\n");

  const testEmailPrefix = `test_${Date.now()}`;
  const testPassword = "PolarisTestPassword123!";

  // Cleanup helper
  const createdUserIds: string[] = [];

  try {
    // ------------------------------------------------------------
    // Group 1: User Account Creation & Password Security
    // ------------------------------------------------------------
    console.log("--- Group 1: User Accounts & Password Hashing ---");

    let testUser1: any;
    await test("1. User creation works with valid data", async () => {
      testUser1 = await userAdminService.createUser(
        {
          email: `${testEmailPrefix}_user1@polaris.local`,
          name: "Test Engineer Alpha",
          password: testPassword,
          role: UserRole.OPERATOR
        },
        "system-test"
      );
      createdUserIds.push(testUser1.id);

      assert(testUser1.id !== undefined, "User ID should be defined");
      assert(testUser1.email === `${testEmailPrefix}_user1@polaris.local`, "Email should be saved in lowercase");
      assert(testUser1.role === UserRole.OPERATOR, "Role should be OPERATOR");
      assert(testUser1.isActive === true, "User should be active by default");
    });

    await test("2. Duplicate email registration is rejected with 409 CONFLICT", async () => {
      let threwConflict = false;
      try {
        await userAdminService.createUser(
          {
            email: `${testEmailPrefix}_USER1@polaris.local`, // mixed case duplicate
            name: "Duplicate User",
            password: testPassword,
            role: UserRole.VIEWER
          },
          "system-test"
        );
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 409) {
          threwConflict = true;
        }
      }
      assert(threwConflict, "Expected ApiError with statusCode 409 on duplicate email");
    });

    await test("3. Password is cryptographically hashed with Argon2id", async () => {
      const userInDb = await prisma.user.findUnique({ where: { id: testUser1.id } });
      assert(!!userInDb, "User must exist in DB");
      assert(userInDb!.passwordHash.startsWith("$argon2id$"), "Hash format must start with $argon2id$");
    });

    await test("4. Plaintext password is never stored in database", async () => {
      const userInDb = await prisma.user.findUnique({ where: { id: testUser1.id } });
      assert(userInDb!.passwordHash !== testPassword, "Hash must never match plaintext");
      assert(!userInDb!.passwordHash.includes(testPassword), "Hash must not contain plaintext");
    });

    await test("5. Argon2id password verification succeeds for matching password", async () => {
      const userInDb = await prisma.user.findUnique({ where: { id: testUser1.id } });
      const isValid = await PasswordService.verifyPassword(userInDb!.passwordHash, testPassword);
      assert(isValid === true, "Argon2id verify must succeed for valid password");
    });

    await test("6. Argon2id password verification fails for incorrect password", async () => {
      const userInDb = await prisma.user.findUnique({ where: { id: testUser1.id } });
      const isValid = await PasswordService.verifyPassword(userInDb!.passwordHash, "WrongPassword999!");
      assert(isValid === false, "Argon2id verify must return false for wrong password");
    });

    // ------------------------------------------------------------
    // Group 2: Login Flow & Generic Error Handling
    // ------------------------------------------------------------
    console.log("\n--- Group 2: Login Flow & Audit Logging ---");

    let loginSessionToken: string = "";
    let loginRefreshToken: string = "";

    await test("7. Correct login credentials succeed and issue tokens", async () => {
      const result = await authService.login(
        `${testEmailPrefix}_user1@polaris.local`,
        testPassword,
        "127.0.0.1",
        "POLARIS-Test-Runner"
      );

      assert(typeof result.accessToken === "string", "Expected string accessToken");
      assert(typeof result.refreshToken === "string", "Expected string refreshToken");
      assert(result.user.id === testUser1.id, "Returned user must match created user");

      loginSessionToken = result.accessToken;
      loginRefreshToken = result.refreshToken;
    });

    await test("8. Login updates lastLoginAt timestamp", async () => {
      const updated = await prisma.user.findUnique({ where: { id: testUser1.id } });
      assert(updated?.lastLoginAt !== null, "lastLoginAt must be populated after login");
    });

    await test("9. Wrong password fails with generic 401 message", async () => {
      let threwAuthError = false;
      try {
        await authService.login(`${testEmailPrefix}_user1@polaris.local`, "IncorrectPassword!");
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          assert(err.message === "Invalid email or password", "Message must be generic");
          threwAuthError = true;
        }
      }
      assert(threwAuthError, "Expected 401 on wrong password");
    });

    await test("10. Unknown email fails with identical generic 401 message", async () => {
      let threwAuthError = false;
      try {
        await authService.login("nonexistent_polar_user_999@polaris.local", "SomePassword123!");
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          assert(err.message === "Invalid email or password", "Message must not leak user non-existence");
          threwAuthError = true;
        }
      }
      assert(threwAuthError, "Expected 401 on unknown email");
    });

    await test("11. Deactivated user login fails with 403 Forbidden", async () => {
      // Temporarily deactivate
      await prisma.user.update({ where: { id: testUser1.id }, data: { isActive: false } });

      let threwForbidden = false;
      try {
        await authService.login(`${testEmailPrefix}_user1@polaris.local`, testPassword);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 403) {
          threwForbidden = true;
        }
      }

      // Re-activate
      await prisma.user.update({ where: { id: testUser1.id }, data: { isActive: true } });
      assert(threwForbidden, "Expected 403 when trying to log into disabled account");
    });

    // ------------------------------------------------------------
    // Group 3: JWT Token Generation & Verification
    // ------------------------------------------------------------
    console.log("\n--- Group 3: JWT Tokens & Claims Validation ---");

    await test("12. Access token has valid JWT structure and claims", async () => {
      const decoded = tokenService.verifyAccessToken(loginSessionToken);
      assert(decoded.sub === testUser1.id, "sub must match user ID");
      assert(decoded.email === `${testEmailPrefix}_user1@polaris.local`, "email claim must match");
      assert(decoded.role === UserRole.OPERATOR, "role claim must match");
      assert(decoded.type === "access", "type claim must be 'access'");
    });

    await test("13. Expired access token is rejected with TOKEN_EXPIRED error", async () => {
      const expiredToken = jwt.sign(
        { sub: testUser1.id, role: UserRole.OPERATOR, type: "access" },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "0s" }
      );

      let threwExpired = false;
      try {
        tokenService.verifyAccessToken(expiredToken);
      } catch (err) {
        if (err instanceof ApiError && err.code === "TOKEN_EXPIRED") {
          threwExpired = true;
        }
      }
      assert(threwExpired, "Expected TOKEN_EXPIRED error");
    });

    await test("14. Token with invalid signature is rejected with INVALID_TOKEN error", async () => {
      const forgedToken = jwt.sign(
        { sub: testUser1.id, role: UserRole.ADMIN, type: "access" },
        "wrong_fake_secret_key"
      );

      let threwInvalid = false;
      try {
        tokenService.verifyAccessToken(forgedToken);
      } catch (err) {
        if (err instanceof ApiError && err.code === "INVALID_TOKEN") {
          threwInvalid = true;
        }
      }
      assert(threwInvalid, "Expected INVALID_TOKEN error");
    });

    await test("15. Refresh token cannot be used as an access token", async () => {
      let threwInvalidType = false;
      try {
        tokenService.verifyAccessToken(loginRefreshToken);
      } catch (err) {
        if (err instanceof ApiError && (err.code === "INVALID_TOKEN_TYPE" || err.code === "INVALID_TOKEN")) {
          threwInvalidType = true;
        }
      }
      assert(threwInvalidType, "Expected access token validator to reject refresh token");
    });

    // ------------------------------------------------------------
    // Group 4: Refresh Token Rotation & Session Management
    // ------------------------------------------------------------
    console.log("\n--- Group 4: Refresh Token Strategy & Rotation ---");

    let rotatedAccessToken: string = "";
    let rotatedRefreshToken: string = "";

    await test("16. Raw refresh token is never stored in DB (only SHA-256 hash)", async () => {
      const hash = CryptoUtil.hashToken(loginRefreshToken);
      const session = await prisma.session.findUnique({ where: { refreshTokenHash: hash } });
      assert(!!session, "Session must exist matching the token hash");
      assert(session!.refreshTokenHash !== loginRefreshToken, "DB must store hash, not raw token");
    });

    await test("17. Refreshing session rotates the refresh token and issues new access token", async () => {
      const result = await authService.refresh(loginRefreshToken, "127.0.0.1", "POLARIS-Test-Runner");
      assert(typeof result.accessToken === "string", "Expected new access token");
      assert(typeof result.newRefreshToken === "string", "Expected new refresh token");
      assert(result.newRefreshToken !== loginRefreshToken, "Rotated refresh token must differ from old one");

      rotatedAccessToken = result.accessToken;
      rotatedRefreshToken = result.newRefreshToken;
    });

    await test("18. Reusing previously rotated refresh token is rejected", async () => {
      let threwReuseError = false;
      try {
        // Attempt to reuse old token
        await authService.refresh(loginRefreshToken);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          threwReuseError = true;
        }
      }
      assert(threwReuseError, "Expected old rotated token to be rejected");
    });

    await test("19. Valid rotated refresh token works on subsequent refresh", async () => {
      const result = await authService.refresh(rotatedRefreshToken);
      assert(result.accessToken.length > 20, "Successive refresh must succeed");
      rotatedRefreshToken = result.newRefreshToken;
    });

    await test("20. Logout revokes the refresh session", async () => {
      await authService.logout(rotatedRefreshToken, testUser1.id);

      let threwAfterLogout = false;
      try {
        await authService.refresh(rotatedRefreshToken);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          threwAfterLogout = true;
        }
      }
      assert(threwAfterLogout, "Expected refresh to fail after logout");
    });

    // ------------------------------------------------------------
    // Group 5: Password Change & Invalidation
    // ------------------------------------------------------------
    console.log("\n--- Group 5: Password Change & Session Revocation ---");

    let passwordChangeSession: string = "";
    await test("21. Login to obtain session before password change", async () => {
      const result = await authService.login(
        `${testEmailPrefix}_user1@polaris.local`,
        testPassword
      );
      passwordChangeSession = result.refreshToken;
      assert(!!passwordChangeSession, "Session established");
    });

    await test("22. Password change rejects incorrect current password", async () => {
      let threwWrongPass = false;
      try {
        await authService.changePassword(testUser1.id, "IncorrectCurrent!", "NewPassword1234!");
      } catch (err) {
        if (err instanceof ApiError && err.code === "INVALID_CURRENT_PASSWORD") {
          threwWrongPass = true;
        }
      }
      assert(threwWrongPass, "Expected INVALID_CURRENT_PASSWORD");
    });

    const newPasswordUpdated = "BrandNewPolarPassword2026!";
    await test("23. Password change succeeds with correct current password", async () => {
      await authService.changePassword(testUser1.id, testPassword, newPasswordUpdated);

      // Verify login with new password succeeds
      const result = await authService.login(
        `${testEmailPrefix}_user1@polaris.local`,
        newPasswordUpdated
      );
      assert(result.user.id === testUser1.id, "Login with new password must succeed");
    });

    await test("24. Password change invalidates previous sessions", async () => {
      let threwRevoked = false;
      try {
        await authService.refresh(passwordChangeSession);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          threwRevoked = true;
        }
      }
      assert(threwRevoked, "Old session must be revoked after password change");
    });

    // ------------------------------------------------------------
    // Group 6: Role-Based Access Control (RBAC) & Middleware
    // ------------------------------------------------------------
    console.log("\n--- Group 6: Role-Based Access Control (RBAC) ---");

    await test("25. Authorize middleware allows ADMIN role on admin-only route", async () => {
      const middleware = authorize(UserRole.ADMIN);
      let passed = false;

      const req: any = {
        user: { id: "admin-id", email: "admin@polaris.local", role: UserRole.ADMIN }
      };
      const res: any = {};
      const next = (err?: any) => {
        if (!err) passed = true;
      };

      middleware(req, res, next);
      assert(passed, "ADMIN must pass authorize(UserRole.ADMIN)");
    });

    await test("26. Authorize middleware rejects VIEWER role on admin-only route with 403", async () => {
      const middleware = authorize(UserRole.ADMIN);
      let threwForbidden = false;

      const req: any = {
        user: { id: "viewer-id", email: "viewer@polaris.local", role: UserRole.VIEWER }
      };
      const res: any = {};
      const next = (err?: any) => {
        if (err instanceof ApiError && err.statusCode === 403) {
          threwForbidden = true;
        }
      };

      try {
        middleware(req, res, next);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 403) {
          threwForbidden = true;
        }
      }

      assert(threwForbidden, "VIEWER must be rejected with 403 on admin-only route");
    });

    await test("27. Authorize middleware rejects OPERATOR role on admin-only route with 403", async () => {
      const middleware = authorize(UserRole.ADMIN);
      let threwForbidden = false;

      const req: any = {
        user: { id: "operator-id", email: "operator@polaris.local", role: UserRole.OPERATOR }
      };
      const res: any = {};
      const next = (err?: any) => {
        if (err instanceof ApiError && err.statusCode === 403) {
          threwForbidden = true;
        }
      };

      try {
        middleware(req, res, next);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 403) {
          threwForbidden = true;
        }
      }

      assert(threwForbidden, "OPERATOR must be rejected with 403 on admin-only route");
    });

    await test("28. Multi-role authorization permits both ADMIN and OPERATOR", async () => {
      const middleware = authorize(UserRole.ADMIN, UserRole.OPERATOR);
      let adminPassed = false;
      let operatorPassed = false;

      middleware(
        { user: { id: "a", email: "a@polaris.local", role: UserRole.ADMIN } } as any,
        {} as any,
        (err) => { if (!err) adminPassed = true; }
      );

      middleware(
        { user: { id: "o", email: "o@polaris.local", role: UserRole.OPERATOR } } as any,
        {} as any,
        (err) => { if (!err) operatorPassed = true; }
      );

      assert(adminPassed && operatorPassed, "Both ADMIN and OPERATOR must pass multi-role check");
    });

    // ------------------------------------------------------------
    // Group 7: Administrative Safeguards & Last-Admin Protection
    // ------------------------------------------------------------
    console.log("\n--- Group 7: Admin User Management & Safeguards ---");

    let testAdminUser: any;
    await test("29. Admin can create additional admin user", async () => {
      testAdminUser = await userAdminService.createUser(
        {
          email: `${testEmailPrefix}_admin2@polaris.local`,
          name: "Test Admin Two",
          password: testPassword,
          role: UserRole.ADMIN
        },
        "system-test"
      );
      createdUserIds.push(testAdminUser.id);
      assert(testAdminUser.role === UserRole.ADMIN, "Role must be ADMIN");
    });

    await test("30. Admin can change role of other user", async () => {
      const updated = await userAdminService.changeRole(
        testUser1.id,
        UserRole.VIEWER,
        testAdminUser.id
      );
      assert(updated.role === UserRole.VIEWER, "Role must be updated to VIEWER");
    });

    await test("31. Admin cannot deactivate own active account", async () => {
      let threwSelfDeactivation = false;
      try {
        await userAdminService.changeStatus(
          testAdminUser.id,
          false,
          testAdminUser.id // actorId === userId
        );
      } catch (err) {
        if (err instanceof ApiError && err.code === "SELF_DEACTIVATION_PREVENTED") {
          threwSelfDeactivation = true;
        }
      }
      assert(threwSelfDeactivation, "Expected SELF_DEACTIVATION_PREVENTED error");
    });

    await test("32. Last active admin cannot be deactivated or demoted (Last-Admin Protection)", async () => {
      // Find all admins and deactivate all except one
      const allAdmins = await prisma.user.findMany({ where: { role: UserRole.ADMIN, isActive: true } });
      assert(allAdmins.length >= 2, "Need at least 2 admins for test setup");

      // Temporarily deactivate other admins so only 1 remains
      const adminToPreserve = allAdmins[0];
      const otherAdmins = allAdmins.slice(1);

      await prisma.user.updateMany({
        where: { id: { in: otherAdmins.map((a) => a.id) } },
        data: { isActive: false }
      });

      let threwLastAdminDeactivation = false;
      let threwLastAdminDemotion = false;

      try {
        await userAdminService.changeStatus(adminToPreserve.id, false, "system-test");
      } catch (err) {
        if (err instanceof ApiError && err.code === "LAST_ADMIN_PROTECTION") {
          threwLastAdminDeactivation = true;
        }
      }

      try {
        await userAdminService.changeRole(adminToPreserve.id, UserRole.VIEWER, "system-test");
      } catch (err) {
        if (err instanceof ApiError && err.code === "LAST_ADMIN_PROTECTION") {
          threwLastAdminDemotion = true;
        }
      }

      // Restore other admins
      await prisma.user.updateMany({
        where: { id: { in: otherAdmins.map((a) => a.id) } },
        data: { isActive: true }
      });

      assert(threwLastAdminDeactivation, "Expected LAST_ADMIN_PROTECTION on deactivating last admin");
      assert(threwLastAdminDemotion, "Expected LAST_ADMIN_PROTECTION on demoting last admin");
    });

    // ------------------------------------------------------------
    // Group 8: Data Privacy & Audit Trail
    // ------------------------------------------------------------
    console.log("\n--- Group 8: Privacy & Audit Trail ---");

    await test("33. Sensitive fields (passwordHash) never appear in sanitized responses", async () => {
      const sanitized = sanitizeUser(testUser1);
      assert(!("passwordHash" in sanitized), "passwordHash must not exist in sanitized user");
      assert(sanitized.id === testUser1.id, "ID must match");
      assert(sanitized.email === testUser1.email, "Email must match");
    });

    await test("34. Audit events are recorded for security operations", async () => {
      const events = await prisma.authenticationEvent.findMany({
        where: { userId: testUser1.id },
        orderBy: { createdAt: "desc" }
      });

      assert(events.length > 0, "Audit trail must have recorded events for user operations");
      const eventTypes = events.map((e) => e.eventType);
      assert(eventTypes.includes("LOGIN_SUCCESS"), "Must contain LOGIN_SUCCESS event");
      assert(eventTypes.includes("PASSWORD_CHANGED"), "Must contain PASSWORD_CHANGED event");
    });

    await test("35. Current user profile endpoint returns fresh authenticated state", async () => {
      const profile = await authService.getCurrentUser(testUser1.id);
      assert(profile.id === testUser1.id, "Profile ID matches");
      assert(profile.isActive === true, "User must be active");
    });
  } finally {
    // Cleanup temporary test users created during test execution
    if (createdUserIds.length > 0) {
      await prisma.authenticationEvent.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  }

  console.log("\n=================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Phase 3 Test Execution Summary: ${passedCount}/${results.length} Passed (${failedCount} Failed)`);
  console.log("=================================================");

  if (failedCount > 0) {
    throw new Error(`${failedCount} test(s) failed in auth-tests suite`);
  }
}

// Direct execution when invoked from CLI
if (require.main === module || process.argv[1]?.includes("auth-tests")) {
  runAuthTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
