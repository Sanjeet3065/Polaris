import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { UserResponse, LoginResponse } from "../types/auth.types";

export const sanitizeUser = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      const result = await authService.login(email, password, ipAddress, userAgent);

      // Set secure HttpOnly cookie for refresh token
      res.cookie("polaris_refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: env.AUTH_COOKIE_SECURE,
        sameSite: env.AUTH_COOKIE_SAME_SITE,
        path: "/api/v1/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const responseData: LoginResponse = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: sanitizeUser(result.user)
      };

      ApiResponse.success(res, responseData, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.polaris_refresh_token || req.body?.refreshToken;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      if (!refreshToken) {
        throw ApiError.unauthorized("Refresh token is required", "MISSING_REFRESH_TOKEN");
      }

      const result = await authService.refresh(refreshToken, ipAddress, userAgent);

      // Update cookie with rotated refresh token
      res.cookie("polaris_refresh_token", result.newRefreshToken, {
        httpOnly: true,
        secure: env.AUTH_COOKIE_SECURE,
        sameSite: env.AUTH_COOKIE_SAME_SITE,
        path: "/api/v1/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      ApiResponse.success(
        res,
        {
          accessToken: result.accessToken,
          refreshToken: result.newRefreshToken,
          user: sanitizeUser(result.user)
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.polaris_refresh_token || req.body?.refreshToken;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;
      const userId = req.user?.id || null;

      await authService.logout(refreshToken, userId, ipAddress, userAgent);

      // Clear cookie
      res.clearCookie("polaris_refresh_token", {
        httpOnly: true,
        secure: env.AUTH_COOKIE_SECURE,
        sameSite: env.AUTH_COOKIE_SAME_SITE,
        path: "/api/v1/auth"
      });

      ApiResponse.success(res, { message: "Successfully logged out" }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized("Unauthenticated user", "UNAUTHENTICATED");
      }

      const user = await authService.getCurrentUser(req.user.id);
      ApiResponse.success(res, sanitizeUser(user), 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized("Unauthenticated user", "UNAUTHENTICATED");
      }

      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        ipAddress,
        userAgent
      );

      // Clear existing refresh cookie
      res.clearCookie("polaris_refresh_token", {
        httpOnly: true,
        secure: env.AUTH_COOKIE_SECURE,
        sameSite: env.AUTH_COOKIE_SAME_SITE,
        path: "/api/v1/auth"
      });

      ApiResponse.success(
        res,
        { message: "Password updated successfully. Please log in with your new credentials." },
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
