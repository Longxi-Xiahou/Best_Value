import type { Cart, Category, OrderDetail, OrderSummary, ProductDetail, ProductListResult, ProductSummary, ReviewResult } from "@/types/product";

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

export const getCart = () => apiFetch<Cart>("/cart");
export const addCartItem = (input: { productId: string; variantId?: string; quantity: number }) => apiFetch<Cart>("/cart/items", { method: "POST", body: JSON.stringify(input) });
export const updateCartItem = (id: string, quantity: number) => apiFetch<Cart>(`/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
export const removeCartItem = (id: string) => apiFetch<Cart>(`/cart/items/${id}`, { method: "DELETE" });
export const clearCart = () => apiFetch<Cart>("/cart", { method: "DELETE" });
export const createOrder = (shippingAddress: { fullName: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country: string }) => apiFetch<{ order: OrderDetail }>("/orders", { method: "POST", body: JSON.stringify({ shippingAddress }) });
export const getOrders = () => apiFetch<{ items: OrderSummary[] }>("/orders");
export const getOrder = (id: string) => apiFetch<{ order: OrderDetail }>(`/orders/${id}`);
export const createCheckoutSession = (orderId: string) => apiFetch<{ payment: { id: string; provider: string; status: string; amount: number; currency: string; createdAt: string }; checkoutUrl: string | null }>("/payments/create-checkout-session", { method: "POST", body: JSON.stringify({ orderId }) });
export const getProductReviews = (id: string) => apiFetch<ReviewResult>(`/products/${id}/reviews`);
export const createProductReview = (id: string, input: { rating: number; title?: string; body: string }) => apiFetch<{ review: ReviewResult["items"][number] }>(`/products/${id}/reviews`, { method: "POST", body: JSON.stringify(input) });
export const updateReview = (id: string, input: Partial<{ rating: number; title: string; body: string }>) => apiFetch<{ review: ReviewResult["items"][number] }>(`/reviews/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteReview = (id: string) => apiFetch<{ message: string }>(`/reviews/${id}`, { method: "DELETE" });
export const getSeller = (id: string) => apiFetch<{ seller: { id: string; storeName: string; slug: string; description: string | null; status: string; products: ProductSummary[] } }>(`/sellers/${id}`);
export const getSellerMe = () => apiFetch<{ seller: { id: string; storeName: string; slug: string; description: string | null; status: string } | null }>("/sellers/me");
export const onboardSeller = (input: { storeName: string; description?: string }) => apiFetch<{ seller: { id: string; storeName: string; slug: string; description: string | null } }>("/sellers/me", { method: "POST", body: JSON.stringify(input) });
export const getSellerDashboard = () => apiFetch<{ totalProducts: number; activeProducts: number; lowStockProducts: Array<{ id: string; title: string; stockQuantity: number }>; lowStockVariants: Array<{ id: string; sku: string; stockQuantity: number; product: { id: string; title: string } }>; recentOrders: Array<{ orderId: string; productName: string; quantity: number; totalPrice: number; order: { status: string; createdAt: string } }> }>("/seller/dashboard");
export const getSellerProducts = () => apiFetch<{ items: Array<Record<string, unknown>> }>("/seller/products");
export const getSellerProduct = (id: string) => apiFetch<{ product: Record<string, unknown> }>(`/seller/products/${id}`);
export const createSellerProduct = (input: Record<string, unknown>) => apiFetch<{ product: Record<string, unknown> }>("/seller/products", { method: "POST", body: JSON.stringify(input) });
export const updateSellerProduct = (id: string, input: Record<string, unknown>) => apiFetch<{ product: Record<string, unknown> }>(`/seller/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const updateSellerInventory = (id: string, input: { stockQuantity: number; variantId?: string }) => apiFetch<{ product: Record<string, unknown> }>(`/seller/products/${id}/inventory`, { method: "PATCH", body: JSON.stringify(input) });
export const getSellerOrders = () => apiFetch<{ items: Array<Record<string, unknown>> }>("/seller/orders");
export const getSellerOrder = (id: string) => apiFetch<{ order: Record<string, unknown> }>(`/seller/orders/${id}`);
export const getSellerTransactions = () => apiFetch<{ items: Array<{ id: string; orderId: string; currency: string; grossAmount: number; platformFeeAmount: number; sellerNetAmount: number; feeRate: number; paymentStatus: string; orderStatus: string; createdAt: string }> }>("/seller/transactions");
