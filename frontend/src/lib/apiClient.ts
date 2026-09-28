import axios, { AxiosError, AxiosResponse } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor for authorization tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("polaris_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent unwrapping and error formatting
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    // Standardize error payload
    const errorData = error.response?.data as { success: false; error?: { message: string; code: string } };
    const formattedError = {
      message: errorData?.error?.message || error.message || "Network request failed",
      code: errorData?.error?.code || "NETWORK_ERROR",
      status: error.response?.status || 500
    };
    return Promise.reject(formattedError);
  }
);
