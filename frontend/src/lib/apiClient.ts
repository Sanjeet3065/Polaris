import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// In-memory access token storage (never stored in localStorage for maximum security)
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true, // Send HttpOnly refresh token cookie automatically
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor: injects in-memory Bearer access token
apiClient.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency refresh lock and queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: automatically handles 401 and silent refresh token rotation
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 error occurs and it's not a login or already-retried refresh request
    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue parallel requests until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh via HttpOnly cookie
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("No access token returned from refresh");
        }

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);

        // Notify app auth state by dispatching auth:expired custom event
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("polaris:auth:expired"));
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Standardize error payload
    const errorData = error.response?.data as {
      success: false;
      error?: { message: string; code: string; details?: unknown };
    };

    const formattedError = {
      message: errorData?.error?.message || error.message || "Network request failed",
      code: errorData?.error?.code || "NETWORK_ERROR",
      status: error.response?.status || 500,
      details: errorData?.error?.details
    };

    return Promise.reject(formattedError);
  }
);
