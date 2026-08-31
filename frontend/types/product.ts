export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface Category extends CategorySummary {
  imageUrl: string | null;
  parentId: string | null;
  children: Category[];
}

export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  price: number;
  currency: string;
  category: CategorySummary;
  image: { url: string; altText: string | null } | null;
  inStock: boolean;
  hasVariants: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductAttribute {
  name: string;
  code: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number | null;
  stockQuantity: number;
  inStock: boolean;
  attributes: ProductAttribute[];
}

export interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  brand: string | null;
  price: number;
  currency: string;
  stockQuantity: number;
  inStock: boolean;
  hasVariants: boolean;
  createdAt: string;
  category: CategorySummary;
  seller: { id: string; storeName: string; slug: string; description: string | null };
  images: Array<{ id: string; url: string; altText: string | null; position: number; variantId: string | null }>;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  reviewStats: { averageRating: number; reviewCount: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResult {
  items: ProductSummary[];
  pagination: Pagination;
}

export interface CartItem {
  id: string;
  product: { id: string; title: string; sellerId: string; image: { url: string; altText: string | null } | null };
  variant: { id: string; sku: string; label: string | null } | null;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
  availableStock: number;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  currency: string;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  productId?: string;
  variantId?: string | null;
  productName: string;
  variantName: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderSummary {
  id: string;
  status: string;
  paymentStatus: string;
  shippingMethodName: string | null;
  currency: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  itemCount: number;
  previewItems: Array<{ productName: string; variantName: string | null; quantity: number }>;
}

export interface OrderDetail extends OrderSummary {
  tax: number;
  updatedAt: string;
  shippingAddress: { fullName: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country: string };
  items: OrderItem[];
  fulfillments: Array<{ id: string; sellerId: string; status: string; shippingMethodId: string; shippingMethodName: string; shippingCost: number; trackingNumber: string | null; carrier: string | null; shippedAt: string | null; deliveredAt: string | null; seller: { id: string; storeName: string; slug: string }; items: Array<{ id: string; orderItemId: string; quantity: number }> }>;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  verifiedPurchase: boolean;
}

export interface ReviewResult {
  averageRating: number;
  reviewCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  items: Review[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
