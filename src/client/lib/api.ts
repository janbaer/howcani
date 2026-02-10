const API_BASE = "/api";

interface ApiError {
  code: string;
  message: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

import { TOKEN_KEY } from "./config";

let accessToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error as ApiError };
    }

    return { data: data as T };
  } catch {
    return { error: { code: "NETWORK_ERROR", message: "Network error occurred" } };
  }
}

// --- Auth types ---

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const auth = {
  async login(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  async me(): Promise<ApiResponse<User>> {
    return request<User>("/auth/me");
  },
};

// --- Item types ---

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Item {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface ItemListResponse {
  items: Item[];
  total: number;
  filters?: {
    search: string | null;
    tags: string[] | null;
  };
}

export interface ItemListParams {
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
}

export interface ItemCreateData {
  question: string;
  answer?: string;
  tags?: string[];
}

export interface ItemUpdateData {
  question?: string;
  answer?: string;
  tags?: string[];
}

export interface ItemCreateResponse {
  item: Item;
}

export interface ItemUpdateResponse {
  item: Item;
}

export const items = {
  async list(username: string, params: ItemListParams = {}): Promise<ApiResponse<ItemListResponse>> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    if (params.search) query.set("search", params.search);
    if (params.tags?.length) query.set("tags", params.tags.join(","));

    const qs = query.toString();
    return request<ItemListResponse>(`/${username}/items${qs ? `?${qs}` : ""}`);
  },

  async getById(username: string, id: string): Promise<ApiResponse<{ item: Item }>> {
    return request<{ item: Item }>(`/${username}/items/${id}`);
  },

  async create(username: string, data: ItemCreateData): Promise<ApiResponse<ItemCreateResponse>> {
    return request<ItemCreateResponse>(`/${username}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(username: string, id: string, data: ItemUpdateData): Promise<ApiResponse<ItemUpdateResponse>> {
    return request<ItemUpdateResponse>(`/${username}/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(username: string, id: string): Promise<ApiResponse<{ success: boolean }>> {
    return request<{ success: boolean }>(`/${username}/items/${id}`, {
      method: "DELETE",
    });
  },
};

// --- Tag types ---

export interface TagWithCount extends Tag {
  item_count: number;
}

export interface TagListResponse {
  tags: TagWithCount[];
}

export interface TagUpdateData {
  name?: string;
  color?: string;
}

export interface TagUpdateResponse {
  tag: Tag;
}

export const tags = {
  async list(username: string): Promise<ApiResponse<TagListResponse>> {
    return request<TagListResponse>(`/${username}/tags`);
  },

  async update(username: string, id: string, data: TagUpdateData): Promise<ApiResponse<TagUpdateResponse>> {
    return request<TagUpdateResponse>(`/${username}/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(username: string, id: string): Promise<ApiResponse<{ success: boolean }>> {
    return request<{ success: boolean }>(`/${username}/tags/${id}`, {
      method: "DELETE",
    });
  },
};
