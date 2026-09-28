import { Request, Response, NextFunction } from "express";
import { userAdminService } from "../services/user-admin.service";
import { ApiResponse } from "../utils/apiResponse";
import { sanitizeUser } from "./auth.controller";
import { ApiError } from "../utils/apiError";

export class UserAdminController {
  /**
   * GET /api/v1/auth/users
   */
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, isActive, search, page, limit } = req.query as any;

      const result = await userAdminService.listUsers({
        role,
        isActive,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });

      ApiResponse.success(
        res,
        result.users.map(sanitizeUser),
        200,
        {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
          total: result.total,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/users/:userId
   */
  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const user = await userAdminService.getUserById(userId);
      ApiResponse.success(res, sanitizeUser(user), 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/users
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, role, isActive } = req.body;
      const actorId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      const user = await userAdminService.createUser(
        { email, password, name, role, isActive },
        actorId,
        ipAddress,
        userAgent
      );

      ApiResponse.success(res, sanitizeUser(user), 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/auth/users/:userId
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { name, email } = req.body;
      const actorId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      const user = await userAdminService.updateUser(
        userId,
        { name, email },
        actorId,
        ipAddress,
        userAgent
      );

      ApiResponse.success(res, sanitizeUser(user), 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/auth/users/:userId/role
   */
  async changeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { role } = req.body;
      const actorId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      const user = await userAdminService.changeRole(
        userId,
        role,
        actorId,
        ipAddress,
        userAgent
      );

      ApiResponse.success(res, sanitizeUser(user), 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/auth/users/:userId/status
   */
  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { isActive } = req.body;
      const actorId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      const user = await userAdminService.changeStatus(
        userId,
        isActive,
        actorId,
        ipAddress,
        userAgent
      );

      ApiResponse.success(res, sanitizeUser(user), 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/users/:userId/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { newPassword } = req.body;
      const actorId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get("User-Agent") || null;

      await userAdminService.resetPassword(
        userId,
        newPassword,
        actorId,
        ipAddress,
        userAgent
      );

      ApiResponse.success(res, { message: "User password successfully reset" }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/events
   */
  async listAuthEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, eventType, page, limit } = req.query as any;

      const result = await userAdminService.listAuthEvents({
        userId,
        eventType,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });

      ApiResponse.success(
        res,
        result.events,
        200,
        {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
          total: result.total,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

export const userAdminController = new UserAdminController();
