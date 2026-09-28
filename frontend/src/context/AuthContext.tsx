import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, Role, LoginCredentials, ChangePasswordData } from "../types/auth";
import { authService } from "../services/authService";

interface AuthContextType {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on startup
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const result = await authService.refresh();
        if (mounted) {
          setUser(result.user);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth expiration events dispatched by apiClient
    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener("polaris:auth:expired", handleAuthExpired);

    return () => {
      mounted = false;
      window.removeEventListener("polaris:auth:expired", handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    await authService.changePassword(data);
    setUser(null); // Requires re-login after password change
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
    } catch {
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    changePassword,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
