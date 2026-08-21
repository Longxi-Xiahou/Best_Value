import type { Category, ProductDetail, ProductListResult } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export class ApiClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const payload = (await response.json()) as ApiResponse<T> & { error?: { message?: string } };

  if (!response.ok || !payload.success) {
    throw new ApiClientError(response.status, payload.error?.message ?? "Request failed");
  }

  return payload.data as T;
}

export interface HealthStatus { status: string; timestamp: string; }

export const getApiHealth = () => apiFetch<HealthStatus>("/health");

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  createdAt: string;
}

interface AuthPayload { user: AuthUser; }

export const registerUser = (input: { email: string; password: string; firstName: string; lastName?: string }) =>
  apiFetch<AuthPayload>("/auth/register", { method: "POST", body: JSON.stringify(input) });

export const loginUser = (input: { email: string; password: string }) =>
  apiFetch<AuthPayload>("/auth/login", { method: "POST", body: JSON.stringify(input) });

export const logoutUser = () => apiFetch<{ message: string }>("/auth/logout", { method: "POST" });

export const getCurrentUser = () => apiFetch<AuthPayload>("/auth/me");

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: "relevance" | "price" | "newest";
  order?: "asc" | "desc";
}

const toQueryString = (query: ProductQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  const result = params.toString();
  return result ? `?${result}` : "";
};

export const getProducts = (query: ProductQuery = {}) => apiFetch<ProductListResult>(`/products${toQueryString(query)}`);
export const getProduct = (id: string) => apiFetch<{ product: ProductDetail }>(`/products/${id}`);
export const getCategories = () => apiFetch<{ items: Category[] }>("/categories");
export const getCategory = (slug: string) => apiFetch<{ category: Category }>(`/categories/${slug}`);
