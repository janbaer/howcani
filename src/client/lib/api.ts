const API_BASE = "/api";

interface ApiError {
  code: string;
  message: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data as ApiError };
    }

    return { data: data as T };
  } catch {
    return { error: { code: "NETWORK_ERROR", message: "Network error occurred" } };
  }
}

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const auth = {
  async login(login: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    });
  },

  async register(
    username: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async refresh(): Promise<ApiResponse<{ accessToken: string }>> {
    return request<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
    });
  },

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    return request<{ success: boolean }>("/auth/logout", {
      method: "POST",
    });
  },

  async me(): Promise<ApiResponse<User>> {
    return request<User>("/auth/me");
  },
};
