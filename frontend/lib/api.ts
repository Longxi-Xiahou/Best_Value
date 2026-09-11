import type { Cart, Category, OrderDetail, OrderSummary, Pagination, ProductDetail, ProductListResult, ProductSummary, ReviewResult } from "@/types/product";

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
  q?: string;
  category?: string;
  categoryId?: string;
  seller?: string;
  brand?: string;
  attributes?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: "relevance" | "price" | "newest" | "oldest" | "popular" | "price_asc" | "price_desc";
  order?: "asc" | "desc";
}

const toQueryString = (query: ProductQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  const result = params.toString();
  return result ? `?${result}` : "";
};

export const getProducts = (query: ProductQuery = {}) => apiFetch<ProductListResult>(`/products${toQueryString(query)}`);
export const getSearchSuggestions = (q: string) => apiFetch<{ items: string[] }>(`/search/suggestions?q=${encodeURIComponent(q)}`);
export const getRelatedProducts = (id: string) => apiFetch<{ items: ProductSummary[] }>(`/products/${id}/related`);
export const getTrendingProducts = () => apiFetch<{ items: ProductSummary[] }>("/products/trending");
export const getRecommendations = (limit = 8) => apiFetch<{ personalized: boolean; items: Array<ProductSummary & { reason?: string }> }>(`/recommendations?limit=${limit}`);
export const getRecentlyViewed = () => apiFetch<{ items: Array<ProductSummary & { reason?: string }> }>("/recommendations/recent");
export const getProduct = (id: string) => apiFetch<{ product: ProductDetail }>(`/products/${id}`);
export const getCategories = () => apiFetch<{ items: Category[] }>("/categories");
export const getCategory = (slug: string) => apiFetch<{ category: Category }>(`/categories/${slug}`);

export const getCart = () => apiFetch<Cart>("/cart");
export const addCartItem = (input: { productId: string; variantId?: string; quantity: number }) => apiFetch<Cart>("/cart/items", { method: "POST", body: JSON.stringify(input) });
export const updateCartItem = (id: string, quantity: number) => apiFetch<Cart>(`/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
export const removeCartItem = (id: string) => apiFetch<Cart>(`/cart/items/${id}`, { method: "DELETE" });
export const clearCart = () => apiFetch<Cart>("/cart", { method: "DELETE" });
export const getShippingMethods = () => apiFetch<{ items: Array<{ id: string; name: string; estimatedDelivery: string; price: number }> }>("/shipping/methods");
export const createOrder = (shippingAddress: { fullName: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country: string }, shippingMethodId = "STANDARD") => apiFetch<{ order: OrderDetail }>("/orders", { method: "POST", body: JSON.stringify({ shippingAddress, shippingMethodId }) });
export const getOrders = () => apiFetch<{ items: OrderSummary[] }>("/orders");
export const getOrder = (id: string) => apiFetch<{ order: OrderDetail }>(`/orders/${id}`);
export const createCheckoutSession = (orderId: string) => apiFetch<{ payment: { id: string; provider: string; status: string; amount: number; currency: string; createdAt: string }; checkoutUrl: string | null }>("/payments/create-checkout-session", { method: "POST", body: JSON.stringify({ orderId }) });
export const getProductReviews = (id: string, query: { page?: number; pageSize?: number; sort?: string; verified?: boolean } = {}) => { const params = new URLSearchParams(); Object.entries(query).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); }); return apiFetch<ReviewResult>(`/products/${id}/reviews${params.toString() ? `?${params}` : ""}`); };
export const createProductReview = (id: string, input: { rating: number; title?: string; body: string }) => apiFetch<{ review: ReviewResult["items"][number] }>(`/products/${id}/reviews`, { method: "POST", body: JSON.stringify(input) });
export const updateReview = (id: string, input: Partial<{ rating: number; title: string; body: string }>) => apiFetch<{ review: ReviewResult["items"][number] }>(`/reviews/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteReview = (id: string) => apiFetch<{ message: string }>(`/reviews/${id}`, { method: "DELETE" });
export const reportReview = (id: string, input: { reason: string; details?: string }) => apiFetch<{ message: string }>(`/reviews/${id}/reports`, { method: "POST", body: JSON.stringify(input) });
export const getAdminReviewReports = () => apiFetch<{ items: Array<{ id: string; reason: string; details: string | null; status: string; review: { id: string; rating: number; body: string; status: string; product: { id: string; title: string } }; reporter: string }> }>("/admin/review-reports");
export const moderateAdminReview = (id: string, action: "HIDE" | "RESTORE" | "REMOVE", reason?: string) => apiFetch<{ review: { id: string; status: string } }>(`/admin/reviews/${id}/moderate`, { method: "PATCH", body: JSON.stringify({ action, reason }) });
export const resolveAdminReviewReport = (id: string, status: "REVIEWED" | "DISMISSED" | "ACTIONED") => apiFetch<{ report: { id: string; status: string } }>(`/admin/review-reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const getSeller = (id: string) => apiFetch<{ seller: { id: string; storeName: string; slug: string; description: string | null; status: string; reputation: { averageRating: number; reviewCount: number; reviewedProductCount: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> }; products: ProductSummary[] } }>(`/sellers/${id}`);
export const getSellerMe = () => apiFetch<{ seller: { id: string; storeName: string; slug: string; description: string | null; status: string } | null }>("/sellers/me");
export const onboardSeller = (input: { storeName: string; description?: string }) => apiFetch<{ seller: { id: string; storeName: string; slug: string; description: string | null } }>("/sellers/me", { method: "POST", body: JSON.stringify(input) });
export const getSellerDashboard = () => apiFetch<{ totalProducts: number; activeProducts: number; reputation: { averageRating: number; reviewCount: number }; lowStockProducts: Array<{ id: string; title: string; stockQuantity: number }>; lowStockVariants: Array<{ id: string; sku: string; stockQuantity: number; product: { id: string; title: string } }>; recentOrders: Array<{ orderId: string; productName: string; quantity: number; totalPrice: number; order: { status: string; createdAt: string } }> }>("/seller/dashboard");
export const getSellerProducts = () => apiFetch<{ items: Array<Record<string, unknown>> }>("/seller/products");
export const getSellerProduct = (id: string) => apiFetch<{ product: Record<string, unknown> }>(`/seller/products/${id}`);
export const createSellerProduct = (input: Record<string, unknown>) => apiFetch<{ product: Record<string, unknown> }>("/seller/products", { method: "POST", body: JSON.stringify(input) });
export const updateSellerProduct = (id: string, input: Record<string, unknown>) => apiFetch<{ product: Record<string, unknown> }>(`/seller/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const updateSellerInventory = (id: string, input: { stockQuantity: number; variantId?: string }) => apiFetch<{ product: Record<string, unknown> }>(`/seller/products/${id}/inventory`, { method: "PATCH", body: JSON.stringify(input) });
export const getSellerOrders = () => apiFetch<{ items: Array<Record<string, unknown>> }>("/seller/orders");
export const getSellerOrder = (id: string) => apiFetch<{ order: Record<string, unknown> }>(`/seller/orders/${id}`);
export const getSellerTransactions = () => apiFetch<{ items: Array<{ id: string; orderId: string; currency: string; grossAmount: number; platformFeeAmount: number; sellerNetAmount: number; feeRate: number; paymentStatus: string; orderStatus: string; createdAt: string }> }>("/seller/transactions");
export interface SellerImportPreview { valid: boolean; rowCount: number; errors: Array<{ row: number; field?: string; message: string }>; rows: Array<{ row: number; title: string; category: string; price: number; currency: string; stock: number; sku: string; imageUrls: string[] }> }
export const previewSellerProductImport = (csv: string) => apiFetch<SellerImportPreview>("/seller/products/import/preview", { method: "POST", body: JSON.stringify({ csv }) });
export const importSellerProducts = (csv: string) => apiFetch<{ importedCount: number; products: Array<{ id: string; title: string; sku: string; status: string }> }>("/seller/products/import", { method: "POST", body: JSON.stringify({ csv }) });

export interface AdminDashboard { totalUsers: number; totalSellers: number; activeProducts: number; pendingOrders: number; paidOrders: number; pendingPayments: number; activeFulfillments: number; pendingReviewReports: number; totalOrderValue: number; platformFees: number; sellerNetAmount: number; }
export const getAdminDashboard = () => apiFetch<AdminDashboard>("/admin/dashboard");
export const getAdminUsers = (query = "") => apiFetch<{ items: Array<{ id: string; email: string; firstName: string | null; lastName: string | null; role: string; createdAt: string; seller: { storeName: string; status: string } | null; _count: { orders: number; reviews: number } }>; pagination: Pagination }>(`/admin/users${query}`);
export const getAdminSellers = (query = "") => apiFetch<{ items: Array<{ id: string; storeName: string; slug: string; status: string; user: { email: string }; _count: { products: number; orderItems: number }; transactionSummary: { grossAmount: number; platformFeeAmount: number; sellerNetAmount: number } }>; pagination: Pagination }>(`/admin/sellers${query}`);
export const getAdminProducts = (query = "") => apiFetch<{ items: Array<{ id: string; title: string; status: string; basePrice: number; seller: { storeName: string }; category: { name: string } }>; pagination: Pagination }>(`/admin/products${query}`);
export const updateAdminProductStatus = (id: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED") => apiFetch<{ product: { id: string; title: string; status: string } }>(`/admin/products/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const getAdminOrders = (query = "") => apiFetch<{ items: Array<{ id: string; status: string; paymentStatus: string; totalAmount: number; createdAt: string; user: { email: string }; _count: { items: number; payments: number; fulfillments: number } }>; pagination: Pagination }>(`/admin/orders${query}`);
export const getAdminPayments = (query = "") => apiFetch<{ items: Array<{ id: string; orderId: string; provider: string; status: string; amount: number; currency: string; refunds: Array<{ amount: number; status: string }> }>; pagination: Pagination }>(`/admin/payments${query}`);
export const getAdminFulfillments = (query = "") => apiFetch<{ items: Array<{ id: string; orderId: string; seller: { storeName: string }; status: string; trackingNumber: string | null; carrier: string | null }>; pagination: Pagination }>(`/admin/fulfillments${query}`);
export const updateAdminFulfillmentStatus = (id: string, status: string, trackingNumber?: string) => apiFetch<{ fulfillment: { id: string; status: string } }>(`/admin/fulfillments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, trackingNumber }) });
export const getAdminAuditLogs = (query = "") => apiFetch<{ items: Array<{ id: string; action: string; targetType: string; targetId: string; createdAt: string; adminUser: { email: string } }>; pagination: Pagination }>(`/admin/audit-logs${query}`);
