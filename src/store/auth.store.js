import { create } from "zustand";
import {
  loginApi,
  refreshTokenApi,
  logoutApi,
} from "../api/auth.api";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem(USER_KEY)) || null,
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || null,

  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY),

  // =========================
  // LOGIN
  // =========================
  login: async (data) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const response = await loginApi(data);

      const {
        user,
        accessToken,
        refreshToken,
      } = response.data;

      // Save tokens
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

      if (refreshToken) {
        localStorage.setItem(
          REFRESH_TOKEN_KEY,
          refreshToken
        );
      }

      // Save user
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
      );

      set({
        user,
        accessToken,
        refreshToken: refreshToken || null,
        loading: false,
        error: null,
        isAuthenticated: true,
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Login failed";

      set({
        loading: false,
        error: message,
        isAuthenticated: false,
      });

      throw new Error(message);
    }
  },

  // =========================
  // REFRESH ACCESS TOKEN
  // =========================
  refreshAccessToken: async () => {
    try {
      const refreshToken =
        localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        throw new Error("Refresh token not found");
      }

      const response =
        await refreshTokenApi(refreshToken);

      const { accessToken } = response.data;

      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        accessToken
      );

      set({
        accessToken,
        isAuthenticated: true,
      });

      return accessToken;
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });

      throw error;
    }
  },

  // =========================
  // LOGOUT
  // =========================
  logout: async () => {
    try {
      const refreshToken =
        localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  },

  // =========================
  // CLEAR ERROR
  // =========================
  clearError: () => {
    set({
      error: null,
    });
  },

  // =========================
  // SET AUTH FROM STORAGE
  // =========================
  initializeAuth: () => {
    const accessToken =
      localStorage.getItem(ACCESS_TOKEN_KEY);

    const refreshToken =
      localStorage.getItem(REFRESH_TOKEN_KEY);

    const user =
      JSON.parse(localStorage.getItem(USER_KEY)) ||
      null;

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
    });
  },
}));

export default useAuthStore;