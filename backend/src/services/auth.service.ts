import { User } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { authenticationEventRepository } from "../repositories/authentication-event.repository";
import { sessionService } from "./session.service";
import { tokenService } from "./token.service";
import { PasswordService } from "../utils/password";
import { ApiError } from "../utils/apiError";
import { logger } from "../utils/logger";

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Authenticates user credentials with constant-time password check and audit logging
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<LoginResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      await authenticationEventRepository.create({
        userId: null,
        eventType: "LOGIN_FAILED",
        success: false,
        ipAddress,
        userAgent,
        metadata: { attemptedEmail: normalizedEmail, reason: "USER_NOT_FOUND" }
      });

      logger.warn("Login attempt for non-existent email", { email: normalizedEmail, ip: ipAddress });
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      await authenticationEventRepository.create({
        userId: user.id,
        eventType: "LOGIN_FAILED",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "ACCOUNT_DISABLED" }
      });

      logger.warn("Login attempt for disabled account", { userId: user.id, ip: ipAddress });
      throw ApiError.forbidden("Account has been disabled. Please contact administrator.", "ACCOUNT_DISABLED");
    }

    const isPasswordValid = await PasswordService.verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      await authenticationEventRepository.create({
        userId: user.id,
        eventType: "LOGIN_FAILED",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "INVALID_PASSWORD" }
      });

      logger.warn("Failed login attempt with invalid password", { userId: user.id, ip: ipAddress });
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    // Update last login timestamp
    await userRepository.updateLastLogin(user.id);

    // Create session and tokens
    const { session, refreshToken } = await sessionService.createSession(user.id, userAgent, ipAddress);

    const accessToken = tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    await authenticationEventRepository.create({
      userId: user.id,
      eventType: "LOGIN_SUCCESS",
      success: true,
      ipAddress,
      userAgent,
      metadata: { sessionId: session.id, role: user.role }
    });

    logger.info("User logged in successfully", { userId: user.id, role: user.role });

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Refreshes access token and rotates refresh token using the session store
   */
  async refresh(
    refreshToken: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<{ user: User; accessToken: string; newRefreshToken: string }> {
    try {
      const result = await sessionService.validateAndRotateSession(refreshToken, userAgent, ipAddress);

      await authenticationEventRepository.create({
        userId: result.user.id,
        eventType: "REFRESH",
        success: true,
        ipAddress,
        userAgent
      });

      return {
        user: result.user,
        accessToken: result.newAccessToken,
        newRefreshToken: result.newRefreshToken
      };
    } catch (error) {
      await authenticationEventRepository.create({
        userId: null,
        eventType: "REFRESH",
        success: false,
        ipAddress,
        userAgent,
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  }

  /**
   * Revokes refresh session and logs audit event
   */
  async logout(
    refreshToken?: string | null,
    userId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    if (refreshToken) {
      await sessionService.revokeSessionByToken(refreshToken);
    }

    await authenticationEventRepository.create({
      userId: userId || null,
      eventType: "LOGOUT",
      success: true,
      ipAddress,
      userAgent
    });

    logger.info("User logged out", { userId });
  }

  /**
   * Retrieves sanitized profile of current authenticated user
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }
    if (!user.isActive) {
      throw ApiError.forbidden("Account is disabled", "ACCOUNT_DISABLED");
    }
    return user;
  }

  /**
   * Changes authenticated user password, revokes existing sessions, and logs security event
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }

    const isCurrentValid = await PasswordService.verifyPassword(user.passwordHash, currentPassword);
    if (!isCurrentValid) {
      await authenticationEventRepository.create({
        userId,
        eventType: "PASSWORD_CHANGED",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "INVALID_CURRENT_PASSWORD" }
      });
      throw ApiError.badRequest("Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    }

    if (currentPassword === newPassword) {
      throw ApiError.badRequest("New password must be different from current password", "PASSWORD_SAME_AS_OLD");
    }

    const newHash = await PasswordService.hashPassword(newPassword);

    await userRepository.update(userId, { passwordHash: newHash });

    // Revoke all previous active sessions to force fresh re-authentication
    const revokedSessions = await sessionService.revokeAllUserSessions(userId);

    await authenticationEventRepository.create({
      userId,
      eventType: "PASSWORD_CHANGED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { revokedSessions }
    });

    logger.info("Password successfully changed and sessions revoked", { userId });
  }
}

export const authService = new AuthService();
