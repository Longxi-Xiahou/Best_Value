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
  seller: { storeName: string; slug: string; description: string | null };
  images: Array<{ id: string; url: string; altText: string | null; position: number; variantId: string | null }>;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
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
