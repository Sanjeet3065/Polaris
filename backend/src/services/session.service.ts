import { Session, User } from "@prisma/client";
import { sessionRepository } from "../repositories/session.repository";
import { tokenService } from "./token.service";
import { CryptoUtil } from "../utils/crypto";
import { ApiError } from "../utils/apiError";
import { logger } from "../utils/logger";

export interface SessionResult {
  session: Session;
  refreshToken: string;
}

export interface RotationResult {
  user: User;
  newRefreshToken: string;
  newAccessToken: string;
}

export class SessionService {
  /**
   * Creates a new persistent authentication session with a securely hashed refresh token
   */
  async createSession(
    userId: string,
    userAgent?: string | null,
    ipAddress?: string | null
  ): Promise<SessionResult> {
    const expiresAt = tokenService.calculateRefreshExpiry();
    const tempSeed = CryptoUtil.generateRandomToken(16);
    const initialPlaceholderHash = CryptoUtil.hashToken(`init_${userId}_${tempSeed}_${Date.now()}`);

    // Create session record in database
    const session = await sessionRepository.create({
      userId,
      refreshTokenHash: initialPlaceholderHash,
      expiresAt,
      userAgent,
      ipAddress
    });

    // Generate signed JWT refresh token referencing session ID
    const refreshToken = tokenService.generateRefreshToken(userId, session.id);
    const refreshTokenHash = CryptoUtil.hashToken(refreshToken);

    // Save final cryptographic hash
    const updatedSession = await sessionRepository.rotate(session.id, refreshTokenHash, expiresAt);

    return {
      session: updatedSession,
      refreshToken
    };
  }

  /**
   * Validates an incoming refresh token and rotates it, issuing a new refresh token and access token
   */
  async validateAndRotateSession(
    refreshToken: string,
    userAgent?: string | null,
    ipAddress?: string | null
  ): Promise<RotationResult> {
    // 1. Verify token signature and claims
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    // 2. Hash the incoming token to lookup in database
    const incomingHash = CryptoUtil.hashToken(refreshToken);
    const session = await sessionRepository.findByTokenHash(incomingHash);

    // 3. Assert session exists and matches decoded claims
    if (!session) {
      logger.warn("Refresh session lookup failed (hash not found)", {
        userId: decoded.sub,
        sessionId: decoded.sessionId,
        ip: ipAddress
      });
      throw ApiError.unauthorized("Invalid or expired session", "SESSION_NOT_FOUND");
    }

    if (session.id !== decoded.sessionId || session.userId !== decoded.sub) {
      logger.warn("Refresh token claim mismatch with stored session", {
        tokenSessionId: decoded.sessionId,
        dbSessionId: session.id
      });
      throw ApiError.unauthorized("Invalid session token", "INVALID_SESSION_CREDENTIALS");
    }

    // 4. Assert session is not revoked
    if (session.revokedAt) {
      logger.warn("Attempt to use revoked refresh session detected", {
        sessionId: session.id,
        userId: session.userId,
        revokedAt: session.revokedAt
      });
      throw ApiError.unauthorized("Authentication session has been revoked. Please sign in again.", "SESSION_REVOKED");
    }

    // 5. Assert session has not expired
    if (session.expiresAt.getTime() <= Date.now()) {
      throw ApiError.unauthorized("Authentication session has expired. Please sign in again.", "SESSION_EXPIRED");
    }

    // 6. Assert associated user is active
    if (!session.user.isActive) {
      throw ApiError.forbidden("Account is deactivated", "ACCOUNT_DISABLED");
    }

    // 7. Token Rotation: generate a fresh refresh token and hash it
    const newExpiresAt = tokenService.calculateRefreshExpiry();
    const newRefreshToken = tokenService.generateRefreshToken(session.userId, session.id);
    const newRefreshTokenHash = CryptoUtil.hashToken(newRefreshToken);

    await sessionRepository.rotate(session.id, newRefreshTokenHash, newExpiresAt);

    // 8. Generate new short-lived access token
    const newAccessToken = tokenService.generateAccessToken({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    });

    return {
      user: session.user,
      newRefreshToken,
      newAccessToken
    };
  }

  /**
   * Revokes a session given the raw refresh token
   */
  async revokeSessionByToken(refreshToken: string): Promise<void> {
    try {
      const hash = CryptoUtil.hashToken(refreshToken);
      const session = await sessionRepository.findByTokenHash(hash);
      if (session && !session.revokedAt) {
        await sessionRepository.revoke(session.id);
      }
    } catch (error) {
      logger.warn("Silent failure while revoking session by token", { error: String(error) });
    }
  }

  /**
   * Revokes all active sessions for a user (e.g. after password reset)
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    return await sessionRepository.revokeAllForUser(userId);
  }
}

export const sessionService = new SessionService();
