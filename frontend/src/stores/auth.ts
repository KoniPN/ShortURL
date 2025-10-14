import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem("token"));
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value);

  // Actions
  async function register(email: string, password: string, name: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ส่ง cookies
        body: JSON.stringify({ email, password, name }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "การสมัครสมาชิกล้มเหลว");
      }

      if (data.token && data.user) {
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem("token", data.token);
      }

      return data;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(email: string, password: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ส่ง cookies
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "การเข้าสู่ระบบล้มเหลว");
      }

      if (data.token && data.user) {
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem("token", data.token);
      }

      return data;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear state regardless of API response
      user.value = null;
      token.value = null;
      localStorage.removeItem("token");
      isLoading.value = false;
    }
  }

  async function fetchUser() {
    if (!token.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        credentials: "include",
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        // Token invalid or expired
        token.value = null;
        user.value = null;
        localStorage.removeItem("token");
        return;
      }

      if (data.user) {
        user.value = data.user;
      }
    } catch (err: any) {
      console.error("Fetch user error:", err);
      // Clear invalid token
      token.value = null;
      user.value = null;
      localStorage.removeItem("token");
    } finally {
      isLoading.value = false;
    }
  }

  // Initialize: Load user if token exists
  async function initialize() {
    if (token.value) {
      await fetchUser();
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,

    // Actions
    register,
    login,
    logout,
    fetchUser,
    initialize,
  };
});
