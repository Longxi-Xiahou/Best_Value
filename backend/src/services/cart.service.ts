import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const cartItemSelect = {
  id: true,
  quantity: true,
  product: {
    select: {
      id: true, title: true, sellerId: true, basePrice: true, currency: true, stockQuantity: true,
      images: { select: { url: true, altText: true }, orderBy: { position: "asc" }, take: 1 },
      variants: { select: { id: true } },
    },
  },
  variant: {
    select: {
      id: true, sku: true, price: true, stockQuantity: true,
      attributes: { select: { value: true, attribute: { select: { name: true } } }, orderBy: { attributeId: "asc" } },
    },
  },
} satisfies Prisma.CartItemSelect;

type CartItemRow = Prisma.CartItemGetPayload<{ select: typeof cartItemSelect }>;

const getAvailableStock = (item: Pick<CartItemRow, "product" | "variant">) => item.variant?.stockQuantity ?? item.product.stockQuantity;
const getUnitPrice = (item: Pick<CartItemRow, "product" | "variant">) => item.variant?.price === null || item.variant?.price === undefined ? Number(item.product.basePrice) : Number(item.variant.price);

const variantLabel = (item: Pick<CartItemRow, "variant">) => item.variant?.attributes.map(({ attribute, value }) => `${attribute.name}: ${value}`).join(" · ") ?? null;

const mapCartItem = (item: CartItemRow) => {
  const unitPrice = getUnitPrice(item);
  return {
    id: item.id,
    product: { id: item.product.id, title: item.product.title, sellerId: item.product.sellerId, image: item.product.images[0] ?? null },
    variant: item.variant ? { id: item.variant.id, sku: item.variant.sku, label: variantLabel(item) } : null,
    quantity: item.quantity,
    unitPrice,
    currency: item.variant?.price === null || item.variant?.price === undefined ? item.product.currency : item.product.currency,
    lineTotal: unitPrice * item.quantity,
    availableStock: getAvailableStock(item),
  };
};

const getCartForUser = (userId: string) => prisma.cart.findUnique({ where: { userId }, select: { id: true, items: { where: { product: { status: ProductStatus.ACTIVE } }, select: cartItemSelect, orderBy: { createdAt: "asc" } } } });

export const getCart = async (userId: string) => {
  const cart = await getCartForUser(userId);
  const items = cart?.items.map(mapCartItem) ?? [];
  return { id: cart?.id ?? null, items, subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0), currency: items[0]?.currency ?? "USD", itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
};

const getOrCreateCart = (userId: string) => prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true } });

export const addCartItem = async (userId: string, productId: string, variantId: string | undefined, quantity: number) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: ProductStatus.ACTIVE },
    select: { id: true, title: true, stockQuantity: true, variants: { select: { id: true, stockQuantity: true } } },
  });
  if (!product) throw new ApiError(404, "Product not found or unavailable", "PRODUCT_UNAVAILABLE");

  const variantsRequired = product.variants.length > 0;
  if (variantsRequired && !variantId) throw new ApiError(400, "Select a product variant", "VARIANT_REQUIRED");
  if (!variantsRequired && variantId) throw new ApiError(400, "This product does not accept a variant", "INVALID_VARIANT");
  const variant = variantId ? product.variants.find((candidate) => candidate.id === variantId) : undefined;
  if (variantId && !variant) throw new ApiError(400, "Variant does not belong to this product", "INVALID_VARIANT");

  const availableStock = variant?.stockQuantity ?? product.stockQuantity;
  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId, variantId: variantId ?? null }, select: { id: true, quantity: true } });
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (availableStock < nextQuantity) throw new ApiError(409, `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available`, "INSUFFICIENT_STOCK");

  if (existing) await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
  else await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity } });
  return getCart(userId);
};

const getOwnedCartItem = async (userId: string, itemId: string) => {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId }, product: { status: ProductStatus.ACTIVE } }, select: { id: true, cartId: true, productId: true, variantId: true, quantity: true } });
  if (!item) throw new ApiError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
  return item;
};

export const updateCartItem = async (userId: string, itemId: string, quantity: number) => {
  const item = await getOwnedCartItem(userId, itemId);
  const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { stockQuantity: true, variants: { where: { id: item.variantId ?? "" }, select: { stockQuantity: true } } } });
  const availableStock = product?.variants[0]?.stockQuantity ?? product?.stockQuantity ?? 0;
  if (quantity > availableStock) throw new ApiError(409, `Only ${availableStock} item${availableStock === 1 ? "" : "s"} available`, "INSUFFICIENT_STOCK");
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart(userId);
};

export const removeCartItem = async (userId: string, itemId: string) => {
  const item = await getOwnedCartItem(userId, itemId);
  await prisma.cartItem.delete({ where: { id: item.id } });
  return getCart(userId);
};

export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCart(userId);
};

export const getCartForCheckout = async (tx: Prisma.TransactionClient, userId: string) => {
  const cart = await tx.cart.findUnique({ where: { userId }, select: { id: true, items: { select: { id: true, productId: true, variantId: true, quantity: true, product: { select: { id: true, title: true, sellerId: true, basePrice: true, currency: true, status: true, stockQuantity: true, variants: { select: { id: true } } } }, variant: { select: { id: true, sku: true, price: true, stockQuantity: true, attributes: { select: { value: true, attribute: { select: { name: true } } }, orderBy: { attributeId: "asc" } } } } } } } });
  return cart;
};

export { variantLabel };
