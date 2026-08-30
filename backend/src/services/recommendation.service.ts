import { ProductInteractionType, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { trendingProducts } from "./search.service.js";

const productSelect = { id: true, title: true, slug: true, brand: true, basePrice: true, currency: true, stockQuantity: true, createdAt: true, category: { select: { id: true, name: true, slug: true } }, seller: { select: { id: true, storeName: true, slug: true } }, images: { select: { url: true, altText: true }, orderBy: { position: "asc" }, take: 1 }, variants: { select: { stockQuantity: true } }, attributes: { select: { attributeId: true, value: true } } } as const;
type ProductRow = Awaited<ReturnType<typeof prisma.product.findMany<{ select: typeof productSelect }>>>[number];
const mapProduct = (product: ProductRow, reason?: string) => ({ id: product.id, title: product.title, slug: product.slug, brand: product.brand, price: Number(product.basePrice), currency: product.currency, category: product.category, image: product.images[0] ?? null, inStock: product.variants.length ? product.variants.some((variant) => variant.stockQuantity > 0) : product.stockQuantity > 0, hasVariants: product.variants.length > 0, ...(reason ? { reason } : {}) });

const recentWeight = (createdAt: Date) => Math.max(1, 30 - Math.floor((Date.now() - createdAt.getTime()) / 86_400_000));

export const recentlyViewed = async (userId: string) => {
  const events = await prisma.productInteraction.findMany({ where: { userId, type: ProductInteractionType.VIEW, product: { status: ProductStatus.ACTIVE } }, orderBy: { createdAt: "desc" }, take: 100, distinct: ["productId"], select: { productId: true, createdAt: true } });
  if (!events.length) return { items: [] };
  const products = await prisma.product.findMany({ where: { id: { in: events.map((event) => event.productId) }, status: ProductStatus.ACTIVE }, select: productSelect });
  const rank = new Map(events.map((event, index) => [event.productId, index]));
  return { items: products.sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)).slice(0, 20).map((product) => mapProduct(product, "Recently viewed")) };
};

export const recommendations = async (userId: string, requestedLimit = 12) => {
  const limit = Math.min(Math.max(Math.floor(requestedLimit), 1), 20);
  const [interactions, purchases, cart] = await prisma.$transaction([
    prisma.productInteraction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, select: { type: true, productId: true, createdAt: true, product: { select: { categoryId: true, brand: true, attributes: { select: { attributeId: true, value: true } } } } } }),
    prisma.orderItem.findMany({ where: { order: { userId, status: { notIn: ["CANCELLED"] } } }, distinct: ["productId"], select: { productId: true, product: { select: { categoryId: true, brand: true, attributes: { select: { attributeId: true, value: true } } } } } }),
    prisma.cartItem.findMany({ where: { cart: { userId } }, select: { productId: true } }),
  ]);
  if (!interactions.length) { const fallback = await trendingProducts(); return { personalized: false, items: fallback.items.slice(0, limit).map((product) => ({ ...product, reason: "Trending products" })) }; }
  const purchasedIds = new Set(purchases.map((item) => item.productId)); const cartIds = new Set(cart.map((item) => item.productId));
  const categoryScores = new Map<string, number>(); const brandScores = new Map<string, number>(); const attributeScores = new Map<string, number>(); const interactedIds = new Set<string>();
  interactions.forEach((interaction) => { interactedIds.add(interaction.productId); const weight = recentWeight(interaction.createdAt) * (interaction.type === ProductInteractionType.ADD_TO_CART ? 3 : 1); if (interaction.product.categoryId) categoryScores.set(interaction.product.categoryId, (categoryScores.get(interaction.product.categoryId) ?? 0) + weight); if (interaction.product.brand) brandScores.set(interaction.product.brand, (brandScores.get(interaction.product.brand) ?? 0) + weight); interaction.product.attributes.forEach((attribute) => attributeScores.set(`${attribute.attributeId}:${attribute.value.toLowerCase()}`, (attributeScores.get(`${attribute.attributeId}:${attribute.value.toLowerCase()}`) ?? 0) + weight)); });
  purchases.forEach((purchase) => { const weight = 20; categoryScores.set(purchase.product.categoryId, (categoryScores.get(purchase.product.categoryId) ?? 0) + weight); if (purchase.product.brand) brandScores.set(purchase.product.brand, (brandScores.get(purchase.product.brand) ?? 0) + weight); purchase.product.attributes.forEach((attribute) => attributeScores.set(`${attribute.attributeId}:${attribute.value.toLowerCase()}`, (attributeScores.get(`${attribute.attributeId}:${attribute.value.toLowerCase()}`) ?? 0) + weight)); });
  const categoryIds = [...categoryScores.keys()].sort((a, b) => (categoryScores.get(b)! - categoryScores.get(a)!)).slice(0, 10); const brands = [...brandScores.keys()].sort((a, b) => (brandScores.get(b)! - brandScores.get(a)!)).slice(0, 10); const attributeIds = [...new Set([...attributeScores.keys()].map((key) => key.split(":")[0]))].slice(0, 20);
  const candidates = await prisma.product.findMany({ where: { status: ProductStatus.ACTIVE, id: { notIn: [...new Set([...purchasedIds, ...cartIds, ...interactedIds])] }, OR: [{ categoryId: { in: categoryIds } }, { brand: { in: brands } }, { attributes: { some: { attributeId: { in: attributeIds } } } }] }, select: productSelect, take: 200 });
  const scored = candidates.map((product) => { let score = 0; const category = categoryScores.get(product.category.id) ?? 0; score += category * 50; if (product.brand) score += (brandScores.get(product.brand) ?? 0) * 30; score += product.attributes.reduce((sum, attribute) => sum + (attributeScores.get(`${attribute.attributeId}:${attribute.value.toLowerCase()}`) ?? 0) * 8, 0); return { product, score }; }).sort((a, b) => b.score - a.score || b.product.createdAt.getTime() - a.product.createdAt.getTime() || a.product.id.localeCompare(b.product.id));
  const selected: typeof scored = []; const sellerCounts = new Map<string, number>(); for (const candidate of scored) { if ((sellerCounts.get(candidate.product.seller.id) ?? 0) >= 4) continue; selected.push(candidate); sellerCounts.set(candidate.product.seller.id, (sellerCounts.get(candidate.product.seller.id) ?? 0) + 1); if (selected.length >= limit) break; }
  return { personalized: true, items: selected.map(({ product }) => mapProduct(product, "Based on your recent activity")) };
};
