export type Role = "ADMIN" | "OPERATOR" | "VIEWER";
export type UserRole = Role;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthEvent {
  id: string;
  userId: string | null;
  eventType: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: Role;
  } | null;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: Role;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}
