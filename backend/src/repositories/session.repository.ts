import { Session, User } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";

export class SessionRepository {
  /**
   * Creates a new persistent authentication session with a hashed refresh token
   */
  async create(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<Session> {
    try {
      return await prisma.session.create({
        data: {
          userId: data.userId,
          refreshTokenHash: data.refreshTokenHash,
          expiresAt: data.expiresAt,
          userAgent: data.userAgent || null,
          ipAddress: data.ipAddress || null
        }
      });
    } catch (error) {
      handleDbError(error, "Session");
    }
  }

  /**
   * Finds an active session by its SHA-256 refresh token hash, including associated user
   */
  async findByTokenHash(refreshTokenHash: string): Promise<(Session & { user: User }) | null> {
    try {
      return await prisma.session.findUnique({
        where: { refreshTokenHash },
        include: { user: true }
      });
    } catch (error) {
      handleDbError(error, "Session");
    }
  }

  /**
   * Finds a session by its UUID
   */
  async findById(id: string): Promise<Session | null> {
    try {
      return await prisma.session.findUnique({
        where: { id }
      });
    } catch (error) {
      handleDbError(error, "Session");
    }
  }

  /**
   * Rotates a session: updates the refresh token hash and extends the expiration
   */
  async rotate(
    id: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date
  ): Promise<Session> {
    try {
      return await prisma.session.update({
        where: { id },
        data: {
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: newExpiresAt,
          revokedAt: null
        }
      });
    } catch (error) {
      handleDbError(error, "Session");
    }
  }

  /**
   * Marks a single session as revoked
   */
  async revoke(id: string): Promise<Session> {
    try {
      return await prisma.session.update({
        where: { id },
        data: { revokedAt: new Date() }
      });
    } catch (error) {
      handleDbError(error, "Session");
    }
  }

  /**
   * Revokes all active sessions for a given user (on password change or security invalidation)
   */
  async revokeAllForUser(userId: string): Promise<number> {
    try {
      const result = await prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
      return result.count;
    } catch (error) {
      handleDbError(error, "Session");
    }
  }

  /**
   * Deletes expired or revoked sessions older than specified cutoff date (cleanup)
   */
  async deleteExpiredBefore(cutoff: Date): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: cutoff } },
            { revokedAt: { lt: cutoff } }
          ]
        }
      });
      return result.count;
    } catch (error) {
      handleDbError(error, "Session");
    }
  }
}

export const sessionRepository = new SessionRepository();
