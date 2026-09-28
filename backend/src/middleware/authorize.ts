import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { ApiError } from "../utils/apiError";

/**
 * Higher-order middleware factory for Role-Based Access Control (RBAC)
 * Verifies that the authenticated user possesses one of the allowed roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required prior to authorization", "UNAUTHENTICATED");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access denied. Role '${req.user.role}' has insufficient permissions for this resource. Required: [${allowedRoles.join(", ")}]`,
        "FORBIDDEN_INSUFFICIENT_ROLE"
      );
    }

    next();
  };
};
