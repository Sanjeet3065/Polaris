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

const USER_KEY = "polaris_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously initialize cached user from localStorage so there is zero flash of login on reload
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // If we already have a user in localStorage, we are NOT in blocking loading state
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !localStorage.getItem(USER_KEY);
  });

  // Validate or silently refresh session on startup
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const hasStoredUser = typeof window !== "undefined" && !!localStorage.getItem(USER_KEY);
      const hasStoredToken = typeof window !== "undefined" && !!localStorage.getItem("polaris_access_token");

      if (!hasStoredUser && !hasStoredToken) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // First try to fetch fresh profile using stored token
        const freshUser = await authService.getMe();
        if (mounted) {
          setUser(freshUser);
        }
      } catch {
        // If access token expired, try silent refresh
        try {
          const result = await authService.refresh();
          if (mounted) {
            setUser(result.user);
          }
        } catch {
          // If refresh also failed, clear session
          if (mounted) {
            setUser(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem(USER_KEY);
              localStorage.removeItem("polaris_access_token");
              localStorage.removeItem("polaris_refresh_token");
            }
          }
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
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("polaris_access_token");
        localStorage.removeItem("polaris_refresh_token");
      }
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
