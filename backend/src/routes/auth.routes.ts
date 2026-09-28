import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authController } from "../controllers/auth.controller";
import { userAdminController } from "../controllers/user-admin.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import { loginRateLimiter } from "../middleware/rateLimiter";
import {
  loginSchema,
  changePasswordSchema,
  refreshSchema
} from "../validators/auth.validator";
import {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  changeStatusSchema,
  resetPasswordSchema,
  userQuerySchema,
  authEventQuerySchema,
  userIdParamSchema
} from "../validators/user-admin.validator";

const router = Router();

// ============================================================
// PUBLIC AUTHENTICATION ENDPOINTS
// ============================================================

// POST /api/v1/auth/login
router.post(
  "/login",
  loginRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  validateRequest({ body: refreshSchema }),
  authController.refresh
);

// POST /api/v1/auth/logout
router.post("/logout", authController.logout);

// ============================================================
// AUTHENTICATED USER ENDPOINTS
// ============================================================

// GET /api/v1/auth/me
router.get("/me", authenticate, authController.getCurrentUser);

// POST /api/v1/auth/change-password
router.post(
  "/change-password",
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword
);

// ============================================================
// ADMIN-ONLY USER & AUDIT MANAGEMENT
// ============================================================

// GET /api/v1/auth/users
router.get(
  "/users",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ query: userQuerySchema }),
  userAdminController.listUsers
);

// GET /api/v1/auth/users/:userId
router.get(
  "/users/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: userIdParamSchema }),
  userAdminController.getUser
);

// POST /api/v1/auth/users
router.post(
  "/users",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createUserSchema }),
  userAdminController.createUser
);

// PATCH /api/v1/auth/users/:userId
router.patch(
  "/users/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: userIdParamSchema, body: updateUserSchema }),
  userAdminController.updateUser
);

// PATCH /api/v1/auth/users/:userId/role
router.patch(
  "/users/:userId/role",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: userIdParamSchema, body: changeRoleSchema }),
  userAdminController.changeRole
);

// PATCH /api/v1/auth/users/:userId/status
router.patch(
  "/users/:userId/status",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: userIdParamSchema, body: changeStatusSchema }),
  userAdminController.changeStatus
);

// POST /api/v1/auth/users/:userId/reset-password
router.post(
  "/users/:userId/reset-password",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: userIdParamSchema, body: resetPasswordSchema }),
  userAdminController.resetPassword
);

// GET /api/v1/auth/events
router.get(
  "/events",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ query: authEventQuerySchema }),
  userAdminController.listAuthEvents
);

export default router;
