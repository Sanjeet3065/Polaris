import { User, UserRole } from "@prisma/client";
import { userRepository, UserFilterOptions } from "../repositories/user.repository";
import { authenticationEventRepository, AuthEventFilterOptions, AuthEventWithUser } from "../repositories/authentication-event.repository";
import { sessionService } from "./session.service";
import { PasswordService } from "../utils/password";
import { ApiError } from "../utils/apiError";
import { logger } from "../utils/logger";

export class UserAdminService {
  /**
   * Lists users with filtering and pagination
   */
  async listUsers(options: UserFilterOptions): Promise<{ users: User[]; total: number }> {
    return await userRepository.findAll(options);
  }

  /**
   * Retrieves a single user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }
    return user;
  }

  /**
   * Creates a new user with hashed password and audit logging
   */
  async createUser(
    data: {
      email: string;
      password: string;
      name: string;
      role: UserRole;
      isActive?: boolean;
    },
    actorId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<User> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw ApiError.conflict("A user with this email address already exists", "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await PasswordService.hashPassword(data.password);

    const user = await userRepository.create({
      email: normalizedEmail,
      passwordHash,
      name: data.name,
      role: data.role,
      isActive: data.isActive !== undefined ? data.isActive : true
    });

    await authenticationEventRepository.create({
      userId: user.id,
      eventType: "USER_CREATED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { actorId, role: user.role }
    });

    logger.info("Admin created new user account", { createdUserId: user.id, actorId, role: user.role });

    return user;
  }

  /**
   * Updates user name or email
   */
  async updateUser(
    userId: string,
    data: { name?: string; email?: string },
    actorId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }

    if (data.email) {
      const normalizedEmail = data.email.toLowerCase().trim();
      if (normalizedEmail !== user.email) {
        const existing = await userRepository.findByEmail(normalizedEmail);
        if (existing) {
          throw ApiError.conflict("A user with this email address already exists", "EMAIL_ALREADY_EXISTS");
        }
      }
    }

    const updated = await userRepository.update(userId, {
      ...(data.name && { name: data.name.trim() }),
      ...(data.email && { email: data.email.toLowerCase().trim() })
    });

    await authenticationEventRepository.create({
      userId: user.id,
      eventType: "USER_UPDATED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { actorId, updatedFields: Object.keys(data) }
    });

    return updated;
  }

  /**
   * Changes user role with safeguard against removing the last active administrator
   */
  async changeRole(
    userId: string,
    newRole: UserRole,
    actorId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }

    if (user.role === newRole) {
      return user;
    }

    // Safeguard: Cannot demote the last active ADMIN
    if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const activeAdmins = await userRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        logger.warn("Prevented removal of last active administrator", { userId, actorId });
        throw ApiError.conflict(
          "Cannot remove the ADMIN role from the last active administrator",
          "LAST_ADMIN_PROTECTION"
        );
      }
    }

    const updated = await userRepository.update(userId, { role: newRole });

    await authenticationEventRepository.create({
      userId: user.id,
      eventType: "ROLE_CHANGED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { actorId, previousRole: user.role, newRole }
    });

    logger.info("User role changed", { userId, previousRole: user.role, newRole, actorId });

    return updated;
  }

  /**
   * Activates or deactivates an account with safeguards against self-deactivation and last-admin deactivation
   */
  async changeStatus(
    userId: string,
    isActive: boolean,
    actorId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }

    if (user.isActive === isActive) {
      return user;
    }

    // Safeguard 1: Admin cannot deactivate their own active session
    if (userId === actorId && !isActive) {
      throw ApiError.badRequest("You cannot deactivate your own administrative account", "SELF_DEACTIVATION_PREVENTED");
    }

    // Safeguard 2: Cannot deactivate the last active ADMIN
    if (user.role === UserRole.ADMIN && !isActive) {
      const activeAdmins = await userRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        logger.warn("Prevented deactivation of last active administrator", { userId, actorId });
        throw ApiError.conflict(
          "Cannot deactivate the last active administrator",
          "LAST_ADMIN_PROTECTION"
        );
      }
    }

    const updated = await userRepository.update(userId, { isActive });

    // If deactivating, revoke all active sessions for immediate logout
    if (!isActive) {
      await sessionService.revokeAllUserSessions(userId);
    }

    await authenticationEventRepository.create({
      userId: user.id,
      eventType: isActive ? "ACCOUNT_ENABLED" : "ACCOUNT_DISABLED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { actorId, isActive }
    });

    logger.info("User account status changed", { userId, isActive, actorId });

    return updated;
  }

  /**
   * Resets a user's password administratively, revoking sessions
   */
  async resetPassword(
    userId: string,
    newPassword: string,
    actorId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found", "USER_NOT_FOUND");
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);

    await userRepository.update(userId, { passwordHash });

    // Revoke all active sessions
    await sessionService.revokeAllUserSessions(userId);

    await authenticationEventRepository.create({
      userId: user.id,
      eventType: "PASSWORD_RESET",
      success: true,
      ipAddress,
      userAgent,
      metadata: { actorId }
    });

    logger.info("User password reset by administrator", { userId, actorId });
  }

  /**
   * Lists security and authentication audit events
   */
  async listAuthEvents(options: AuthEventFilterOptions): Promise<{
    events: AuthEventWithUser[];
    total: number;
  }> {
    return await authenticationEventRepository.findAll(options);
  }
}

export const userAdminService = new UserAdminService();
