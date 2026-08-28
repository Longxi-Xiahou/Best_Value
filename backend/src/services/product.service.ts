import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { ListProductsQuery } from "../validators/catalog.validation.js";
import { ApiError } from "../utils/api-error.js";
import { getCategoryAndDescendantIds } from "./category.service.js";

const productListSelect = {
  id: true,
  title: true,
  slug: true,
  brand: true,
  basePrice: true,
  currency: true,
  stockQuantity: true,
  category: { select: { id: true, name: true, slug: true } },
  images: { select: { url: true, altText: true }, orderBy: { position: "asc" }, take: 1 },
  variants: { select: { stockQuantity: true } },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  brand: true,
  basePrice: true,
  currency: true,
  stockQuantity: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  seller: { select: { id: true, storeName: true, slug: true, description: true } },
  images: { select: { id: true, url: true, altText: true, position: true, variantId: true }, orderBy: { position: "asc" } },
  attributes: { select: { value: true, attribute: { select: { name: true, code: true } } }, orderBy: { attributeId: "asc" } },
  variants: {
    select: {
      id: true, sku: true, price: true, stockQuantity: true,
      attributes: { select: { value: true, attribute: { select: { name: true, code: true } } }, orderBy: { attributeId: "asc" } },
    },
    orderBy: { sku: "asc" },
  },
} satisfies Prisma.ProductSelect;

type ProductListRow = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;
type ProductDetailRow = Prisma.ProductGetPayload<{ select: typeof productDetailSelect }>;

const isAvailable = (product: Pick<ProductListRow, "stockQuantity" | "variants">) =>
  product.variants.length > 0 ? product.variants.some((variant) => variant.stockQuantity > 0) : product.stockQuantity > 0;

const mapListProduct = (product: ProductListRow) => ({
  id: product.id,
  title: product.title,
  slug: product.slug,
  brand: product.brand,
  price: Number(product.basePrice),
  currency: product.currency,
  category: product.category,
  image: product.images[0] ?? null,
  inStock: isAvailable(product),
  hasVariants: product.variants.length > 0,
});

const mapDetailProduct = (product: ProductDetailRow) => ({
  id: product.id,
  title: product.title,
  slug: product.slug,
  description: product.description,
  brand: product.brand,
  price: Number(product.basePrice),
  currency: product.currency,
  stockQuantity: product.stockQuantity,
  inStock: isAvailable(product),
  hasVariants: product.variants.length > 0,
  createdAt: product.createdAt,
  category: product.category,
  seller: product.seller,
  images: product.images,
  attributes: product.attributes.map(({ attribute, value }) => ({ ...attribute, value })),
  variants: product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    price: variant.price === null ? null : Number(variant.price),
    stockQuantity: variant.stockQuantity,
    inStock: variant.stockQuantity > 0,
    attributes: variant.attributes.map(({ attribute, value }) => ({ ...attribute, value })),
  })),
});

const resolveCategoryIds = async (query: ListProductsQuery): Promise<string[] | undefined> => {
  if (!query.category && !query.categoryId) return undefined;
  const category = query.category
    ? await prisma.category.findUnique({ where: { slug: query.category }, select: { id: true } })
    : await prisma.category.findUnique({ where: { id: query.categoryId! }, select: { id: true } });

  if (!category) throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  return getCategoryAndDescendantIds(category.id);
};

const getOrderBy = (sort: ListProductsQuery["sort"], requestedOrder: ListProductsQuery["order"]): Prisma.ProductOrderByWithRelationInput[] => {
  if (sort === "price") return [{ basePrice: requestedOrder ?? "asc" }, { id: "asc" }];
  if (sort === "newest") return [{ createdAt: requestedOrder ?? "desc" }, { id: "desc" }];
  return [{ createdAt: "desc" }, { id: "desc" }];
};

export const listProducts = async (query: ListProductsQuery) => {
  const categoryIds = await resolveCategoryIds(query);
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined ? {
      basePrice: { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) },
    } : {}),
    ...(query.search ? {
      OR: [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
        { brand: { contains: query.search } },
        { variants: { some: { sku: { contains: query.search } } } },
      ],
    } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ where, select: productListSelect, orderBy: getOrderBy(query.sort, query.order), skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(mapListProduct),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findFirst({ where: { id, status: ProductStatus.ACTIVE }, select: productDetailSelect });
  if (!product) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  return mapDetailProduct(product);
};
