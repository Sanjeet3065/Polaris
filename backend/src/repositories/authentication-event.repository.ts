import { AuthenticationEvent, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";

export interface AuthEventFilterOptions {
  userId?: string;
  eventType?: string;
  page?: number;
  limit?: number;
}

export type AuthEventWithUser = AuthenticationEvent & {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null;
};

export class AuthenticationEventRepository {
  /**
   * Logs a security or authentication audit event
   */
  async create(data: {
    userId?: string | null;
    eventType: string;
    success: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<AuthenticationEvent> {
    try {
      return await prisma.authenticationEvent.create({
        data: {
          userId: data.userId || null,
          eventType: data.eventType,
          success: data.success,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent ? data.userAgent.slice(0, 500) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });
    } catch (error) {
      handleDbError(error, "AuthenticationEvent");
    }
  }

  /**
   * Lists authentication events with optional user/eventType filters and pagination
   */
  async findAll(options: AuthEventFilterOptions): Promise<{
    events: AuthEventWithUser[];
    total: number;
  }> {
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 20));
      const skip = (page - 1) * limit;

      const where: Prisma.AuthenticationEventWhereInput = {
        ...(options.userId && { userId: options.userId }),
        ...(options.eventType && { eventType: options.eventType })
      };

      const [events, total] = await Promise.all([
        prisma.authenticationEvent.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.authenticationEvent.count({ where })
      ]);

      return { events, total };
    } catch (error) {
      handleDbError(error, "AuthenticationEvents");
    }
  }
}

export const authenticationEventRepository = new AuthenticationEventRepository();
