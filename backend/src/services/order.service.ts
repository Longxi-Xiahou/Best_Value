import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import type { ShippingAddressInput } from "../validators/commerce.validation.js";
import { ApiError } from "../utils/api-error.js";
import { getCartForCheckout, variantLabel } from "./cart.service.js";

const orderSummarySelect = {
  id: true, status: true, paymentStatus: true, currency: true, subtotalAmount: true, shippingAmount: true, totalAmount: true, createdAt: true,
  items: { select: { id: true, productName: true, variantName: true, quantity: true, unitPrice: true, totalPrice: true } },
} satisfies Prisma.OrderSelect;

const orderDetailSelect = {
  id: true, status: true, paymentStatus: true, currency: true, subtotalAmount: true, shippingAmount: true, taxAmount: true, totalAmount: true, shippingAddress: true, createdAt: true, updatedAt: true,
  items: { select: { id: true, productId: true, variantId: true, productName: true, variantName: true, sku: true, quantity: true, unitPrice: true, totalPrice: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderSelect;

const mapOrder = (order: Prisma.OrderGetPayload<{ select: typeof orderDetailSelect }>) => ({
  id: order.id,
  status: order.status,
  paymentStatus: order.paymentStatus,
  currency: order.currency,
  subtotal: Number(order.subtotalAmount),
  shipping: Number(order.shippingAmount),
  tax: Number(order.taxAmount),
  total: Number(order.totalAmount),
  shippingAddress: order.shippingAddress,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), totalPrice: Number(item.totalPrice) })),
});

const cents = (value: Prisma.Decimal | number) => Math.round(Number(value) * 100);
const decimal = (valueInCents: number) => new Prisma.Decimal(valueInCents).dividedBy(100);

export const createOrder = async (userId: string, shippingAddress: ShippingAddressInput) => {
  const order = await prisma.$transaction(async (tx) => {
    const cart = await getCartForCheckout(tx, userId);
    if (!cart || cart.items.length === 0) throw new ApiError(400, "Your cart is empty", "EMPTY_CART");

    let subtotalCents = 0;
    const orderCurrency = cart.items[0].product.currency;
    const snapshots: Array<{
      cartItemId: string; productId: string; variantId: string | null; sellerId: string; productName: string; variantName: string | null;
      sku: string | null; quantity: number; unitPriceCents: number; totalPriceCents: number;
    }> = [];

    for (const item of cart.items) {
      if (item.product.status !== ProductStatus.ACTIVE) throw new ApiError(409, `${item.product.title} is no longer available`, "PRODUCT_UNAVAILABLE");
      if (item.product.currency !== orderCurrency) throw new ApiError(409, "Cart items must use the same currency", "MIXED_CURRENCIES");
      if (item.product.variants?.length && !item.variant) throw new ApiError(409, `Select a variant for ${item.product.title}`, "VARIANT_REQUIRED");

      const availableStock = item.variant?.stockQuantity ?? item.product.stockQuantity;
      const unitPriceCents = cents(item.variant?.price ?? item.product.basePrice);
      if (item.quantity > availableStock) throw new ApiError(409, `Insufficient stock for ${item.product.title}`, "INSUFFICIENT_STOCK");
      if (unitPriceCents < 0) throw new ApiError(409, "Product pricing is invalid", "INVALID_PRICE");
      const totalPriceCents = unitPriceCents * item.quantity;
      subtotalCents += totalPriceCents;
      snapshots.push({ cartItemId: item.id, productId: item.productId, variantId: item.variantId, sellerId: item.product.sellerId, productName: item.product.title, variantName: item.variant ? variantLabel(item) : null, sku: item.variant?.sku ?? null, quantity: item.quantity, unitPriceCents, totalPriceCents });
    }

    for (const item of snapshots) {
      const result = item.variantId
        ? await tx.productVariant.updateMany({ where: { id: item.variantId, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } })
        : await tx.product.updateMany({ where: { id: item.productId, status: ProductStatus.ACTIVE, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
      if (result.count !== 1) throw new ApiError(409, `Insufficient stock for ${item.productName}`, "INSUFFICIENT_STOCK");
    }

    const shippingCents = 0;
    const totalCents = subtotalCents + shippingCents;
    const created = await tx.order.create({
      data: {
        userId, status: "PENDING", currency: orderCurrency, subtotalAmount: decimal(subtotalCents), shippingAmount: decimal(shippingCents), taxAmount: decimal(0), totalAmount: decimal(totalCents), shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
        items: { create: snapshots.map((item) => ({ productId: item.productId, variantId: item.variantId, sellerId: item.sellerId, productName: item.productName, variantName: item.variantName, sku: item.sku, quantity: item.quantity, unitPrice: decimal(item.unitPriceCents), totalPrice: decimal(item.totalPriceCents) })) },
      },
      select: orderDetailSelect,
    });
    const sellerTotals = new Map<string, number>();
    for (const item of snapshots) sellerTotals.set(item.sellerId, (sellerTotals.get(item.sellerId) ?? 0) + item.totalPriceCents);
    const feeRate = new Prisma.Decimal(env.PLATFORM_FEE_PERCENT);
    await tx.sellerOrderAllocation.createMany({ data: [...sellerTotals.entries()].map(([sellerId, grossCents]) => {
      const gross = decimal(grossCents);
      const fee = gross.mul(feeRate).dividedBy(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      return { orderId: created.id, sellerId, grossAmount: gross, platformFeeAmount: fee, sellerNetAmount: gross.minus(fee), feeRate, currency: orderCurrency };
    }) });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return mapOrder(order);
};

export const listOrders = async (userId: string) => {
  const orders = await prisma.order.findMany({ where: { userId }, select: orderSummarySelect, orderBy: { createdAt: "desc" } });
  return orders.map((order) => ({ id: order.id, status: order.status, paymentStatus: order.paymentStatus, currency: order.currency, subtotal: Number(order.subtotalAmount), shipping: Number(order.shippingAmount), total: Number(order.totalAmount), createdAt: order.createdAt, itemCount: order.items.reduce((count, item) => count + item.quantity, 0), previewItems: order.items.slice(0, 3).map((item) => ({ productName: item.productName, variantName: item.variantName, quantity: item.quantity })) }));
};

export const getOrder = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, select: orderDetailSelect });
  if (!order) throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  return mapOrder(order);
};
