import { User, UserRole, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { handleDbError } from "../utils/dbErrorHandler";

export interface UserFilterOptions {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class UserRepository {
  /**
   * Find a user by lowercase email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
    } catch (error) {
      handleDbError(error, "User");
    }
  }

  /**
   * Find a user by UUID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id }
      });
    } catch (error) {
      handleDbError(error, "User");
    }
  }

  /**
   * Create a new user account
   */
  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash,
          name: data.name.trim(),
          role: data.role || UserRole.VIEWER,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });
    } catch (error) {
      handleDbError(error, "User");
    }
  }

  /**
   * Update an existing user account
   */
  async update(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data
      });
    } catch (error) {
      handleDbError(error, "User");
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { lastLoginAt: new Date() }
      });
    } catch (error) {
      handleDbError(error, "User");
    }
  }

  /**
   * Count active administrators in the database (safeguard for last active admin)
   */
  async countActiveAdmins(): Promise<number> {
    try {
      return await prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          isActive: true
        }
      });
    } catch (error) {
      handleDbError(error, "User");
    }
  }

  /**
   * Find all users with optional filtering, search, and pagination
   */
  async findAll(options: UserFilterOptions): Promise<{ users: User[]; total: number }> {
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 20));
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {
        ...(options.role && { role: options.role }),
        ...(options.isActive !== undefined && { isActive: options.isActive }),
        ...(options.search && {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } }
          ]
        })
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      return { users, total };
    } catch (error) {
      handleDbError(error, "Users");
    }
  }
}

export const userRepository = new UserRepository();
