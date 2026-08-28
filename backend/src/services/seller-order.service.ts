import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const itemSelect = { id: true, orderId: true, productId: true, variantId: true, productName: true, variantName: true, sku: true, quantity: true, unitPrice: true, totalPrice: true, order: { select: { id: true, status: true, createdAt: true, shippingAddress: true, currency: true } } } satisfies Prisma.OrderItemSelect;

const mapItem = (item: Prisma.OrderItemGetPayload<{ select: typeof itemSelect }>) => ({ ...item, unitPrice: Number(item.unitPrice), totalPrice: Number(item.totalPrice) });

export const listSellerOrders = async (sellerId: string) => {
  const items = await prisma.orderItem.findMany({ where: { sellerId }, select: itemSelect, orderBy: { createdAt: "desc" } });
  const groups = new Map<string, { id: string; status: string; createdAt: Date; currency: string; shippingAddress: Prisma.JsonValue; items: ReturnType<typeof mapItem>[] }>();
  items.forEach((item) => { const current = groups.get(item.orderId) ?? { id: item.order.id, status: item.order.status, createdAt: item.order.createdAt, currency: item.order.currency, shippingAddress: item.order.shippingAddress, items: [] }; current.items.push(mapItem(item)); groups.set(item.orderId, current); });
  return [...groups.values()];
};

export const getSellerOrder = async (sellerId: string, orderId: string) => {
  const items = await prisma.orderItem.findMany({ where: { sellerId, orderId }, select: itemSelect, orderBy: { createdAt: "asc" } });
  if (!items.length) throw new ApiError(404, "Seller order not found", "SELLER_ORDER_NOT_FOUND");
  return { id: orderId, status: items[0].order.status, createdAt: items[0].order.createdAt, currency: items[0].order.currency, shippingAddress: items[0].order.shippingAddress, items: items.map(mapItem) };
};
