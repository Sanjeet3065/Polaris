import { apiClient, setAccessToken } from "../lib/apiClient";
import {
  AuthUser,
  LoginCredentials,
  ChangePasswordData,
  CreateUserData,
  UpdateUserData,
  Role,
  AuthEvent
} from "../types/auth";
import { ApiResponseEnvelope } from "../types";

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface UserListResult {
  users: AuthUser[];
  total: number;
}

export interface AuthEventListResult {
  events: AuthEvent[];
  total: number;
}

export const authService = {
  /**
   * Authenticates user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<LoginResult>>(
      "/auth/login",
      credentials
    );
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  /**
   * Silently refreshes access token using the HttpOnly cookie
   */
  async refresh(): Promise<LoginResult> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<LoginResult>>(
      "/auth/refresh",
      {}
    );
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  /**
   * Revokes refresh session and clears cookie
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Retrieves profile of current authenticated user
   */
  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<AuthUser>>("/auth/me");
    return res.data;
  },

  /**
   * Changes authenticated user password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.post("/auth/change-password", data);
    setAccessToken(null);
  },

  // ============================================================
  // ADMIN APIs
  // ============================================================

  /**
   * Lists users with filtering and pagination
   */
  async getUsers(params?: {
    role?: Role;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: AuthUser[]; total: number }> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<AuthUser[]> & { meta?: { total?: number } }>(
      "/auth/users",
      { params }
    );
    return {
      users: res.data,
      total: res.meta?.total || res.data.length
    };
  },

  /**
   * Retrieves a single user by ID
   */
  async getUserById(userId: string): Promise<AuthUser> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<AuthUser>>(
      `/auth/users/${userId}`
    );
    return res.data;
  },

  /**
   * Creates a new user account
   */
  async createUser(data: CreateUserData): Promise<AuthUser> {
    const res = await apiClient.post<unknown, ApiResponseEnvelope<AuthUser>>(
      "/auth/users",
      data
    );
    return res.data;
  },

  /**
   * Updates user name or email
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<AuthUser> {
    const res = await apiClient.patch<unknown, ApiResponseEnvelope<AuthUser>>(
      `/auth/users/${userId}`,
      data
    );
    return res.data;
  },

  /**
   * Changes user role
   */
  async changeRole(userId: string, role: Role): Promise<AuthUser> {
    const res = await apiClient.patch<unknown, ApiResponseEnvelope<AuthUser>>(
      `/auth/users/${userId}/role`,
      { role }
    );
    return res.data;
  },

  /**
   * Activates or deactivates a user account
   */
  async changeStatus(userId: string, isActive: boolean): Promise<AuthUser> {
    const res = await apiClient.patch<unknown, ApiResponseEnvelope<AuthUser>>(
      `/auth/users/${userId}/status`,
      { isActive }
    );
    return res.data;
  },

  /**
   * Administratively resets a user password
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await apiClient.post(`/auth/users/${userId}/reset-password`, {
      newPassword
    });
  },

  /**
   * Lists security audit events
   */
  async getAuthEvents(params?: {
    userId?: string;
    eventType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: AuthEvent[]; total: number }> {
    const res = await apiClient.get<unknown, ApiResponseEnvelope<AuthEvent[]> & { meta?: { total?: number } }>(
      "/auth/events",
      { params }
    );
    return {
      events: res.data,
      total: res.meta?.total || res.data.length
    };
  }
};
