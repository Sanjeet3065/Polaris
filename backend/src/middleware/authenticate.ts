import { Request, Response, NextFunction } from "express";
import { tokenService } from "../services/token.service";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/apiError";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized("Authentication token required", "MISSING_TOKEN");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw ApiError.unauthorized(
        "Invalid authorization header format. Expected 'Bearer <token>'",
        "MALFORMED_HEADER"
      );
    }

    const token = parts[1];
    const decoded = tokenService.verifyAccessToken(token);

    // Verify user still exists in database and account is active
    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      throw ApiError.unauthorized("User account no longer exists", "USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Account is deactivated", "ACCOUNT_DISABLED");
    }

    // Attach verified user context to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    next(error);
  }
};
