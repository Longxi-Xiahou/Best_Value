import { Prisma, SellerStatus, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type { SellerProductCreateInput } from "../validators/seller.validation.js";

const publicSellerSelect = { id: true, storeName: true, slug: true, description: true, status: true, createdAt: true } satisfies Prisma.SellerSelect;

export const getSellerReputation = async (sellerId: string) => {
  const where: Prisma.ReviewWhereInput = { status: "PUBLISHED", product: { sellerId } };
  const [aggregate, grouped, reviewedProducts] = await Promise.all([
    prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ["rating"], where, _count: { _all: true } }),
    prisma.review.groupBy({ by: ["productId"], where }),
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  grouped.forEach((row) => { distribution[row.rating as 1 | 2 | 3 | 4 | 5] = row._count._all; });
  return { averageRating: aggregate._avg.rating == null ? 0 : Math.round(aggregate._avg.rating * 10) / 10, reviewCount: aggregate._count._all, reviewedProductCount: reviewedProducts.length, distribution };
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 170) || "store";

const uniqueSlug = async (storeName: string, currentId?: string) => {
  const base = slugify(storeName);
  let slug = base;
  let suffix = 2;
  while (await prisma.seller.findFirst({ where: { slug, ...(currentId ? { NOT: { id: currentId } } : {}) }, select: { id: true } })) slug = `${base}-${suffix++}`;
  return slug;
};

export const getSellerForUser = (userId: string) => prisma.seller.findUnique({ where: { userId }, select: { id: true, storeName: true, slug: true, description: true, status: true } });

export const onboardSeller = async (userId: string, storeName: string, description?: string) => {
  const existing = await prisma.seller.findUnique({ where: { userId }, select: publicSellerSelect });
  if (existing) throw new ApiError(409, "You already have a seller profile", "SELLER_ALREADY_EXISTS");
  const seller = await prisma.$transaction(async (tx) => {
    const slug = await uniqueSlug(storeName);
    const created = await tx.seller.create({ data: { userId, storeName, slug, description: description || null, status: SellerStatus.ACTIVE }, select: publicSellerSelect });
    await tx.user.update({ where: { id: userId }, data: { role: UserRole.SELLER } });
    return created;
  });
  return seller;
};

export const getPublicSeller = async (identifier: string) => {
  const seller = await prisma.seller.findFirst({ where: { OR: [{ id: identifier }, { slug: identifier }], status: { not: SellerStatus.SUSPENDED } }, select: { ...publicSellerSelect, products: { where: { status: "ACTIVE" }, select: { id: true, title: true, slug: true, basePrice: true, currency: true, stockQuantity: true, images: { select: { url: true, altText: true }, orderBy: { position: "asc" }, take: 1 }, category: { select: { id: true, name: true, slug: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!seller) throw new ApiError(404, "Seller not found", "SELLER_NOT_FOUND");
  const reputation = await getSellerReputation(seller.id);
  return { ...seller, reputation, products: seller.products.map((product) => ({ ...product, price: Number(product.basePrice), image: product.images[0] ?? null, images: undefined })) };
};

export const getSellerDashboard = async (sellerId: string) => {
  const [totalProducts, activeProducts, lowStockProducts, lowStockVariants, recentOrders, reputation] = await prisma.$transaction([
    prisma.product.count({ where: { sellerId } }),
    prisma.product.count({ where: { sellerId, status: "ACTIVE" } }),
    prisma.product.findMany({ where: { sellerId, stockQuantity: { lte: 5 }, variants: { none: {} } }, select: { id: true, title: true, stockQuantity: true }, orderBy: { stockQuantity: "asc" }, take: 10 }),
    prisma.productVariant.findMany({ where: { product: { sellerId }, stockQuantity: { lte: 5 } }, select: { id: true, sku: true, stockQuantity: true, product: { select: { id: true, title: true } } }, orderBy: { stockQuantity: "asc" }, take: 10 }),
    prisma.orderItem.findMany({ where: { sellerId }, select: { orderId: true, productName: true, quantity: true, totalPrice: true, order: { select: { status: true, createdAt: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.review.aggregate({ where: { status: "PUBLISHED", product: { sellerId } }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  return { totalProducts, activeProducts, lowStockProducts, lowStockVariants, reputation: { averageRating: reputation._avg.rating == null ? 0 : Math.round(reputation._avg.rating * 10) / 10, reviewCount: reputation._count._all }, recentOrders: recentOrders.map((item) => ({ ...item, totalPrice: Number(item.totalPrice) })) };
};

export const assertSellerOwnsProduct = async (sellerId: string, productId: string) => {
  const product = await prisma.product.findFirst({ where: { id: productId, sellerId }, select: { id: true, sellerId: true } });
  if (!product) throw new ApiError(404, "Seller product not found", "SELLER_PRODUCT_NOT_FOUND");
  return product;
};
