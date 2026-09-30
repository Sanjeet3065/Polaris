import { UserRole } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  type: "access";
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: "refresh";
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserResponse;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  user?: UserResponse;
}

export interface AuthEventResponse {
  id: string;
  userId: string | null;
  eventType: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: Date | string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null;
}
