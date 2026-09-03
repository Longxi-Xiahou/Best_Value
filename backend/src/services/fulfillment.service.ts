import { FulfillmentStatus, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const select = { id: true, orderId: true, sellerId: true, status: true, shippingMethodId: true, shippingMethodName: true, shippingCost: true, trackingNumber: true, carrier: true, shippedAt: true, deliveredAt: true, createdAt: true, updatedAt: true, seller: { select: { id: true, storeName: true, slug: true } }, items: { select: { id: true, orderItemId: true, quantity: true, orderItem: { select: { productName: true, variantName: true, sku: true } } } } } satisfies Prisma.FulfillmentSelect;
const map = (fulfillment: Prisma.FulfillmentGetPayload<{ select: typeof select }>) => ({ ...fulfillment, shippingCost: Number(fulfillment.shippingCost) });

const transitions: Record<FulfillmentStatus, FulfillmentStatus[]> = { PENDING: [FulfillmentStatus.PROCESSING, FulfillmentStatus.CANCELLED], PROCESSING: [FulfillmentStatus.SHIPPED, FulfillmentStatus.CANCELLED], SHIPPED: [FulfillmentStatus.DELIVERED], DELIVERED: [], CANCELLED: [] };

const syncOrderStatus = async (tx: Prisma.TransactionClient, orderId: string) => {
  const fulfillments = await tx.fulfillment.findMany({ where: { orderId }, select: { status: true } });
  if (!fulfillments.length) return;
  const statuses = fulfillments.map((item) => item.status);
  const next = statuses.every((status) => status === FulfillmentStatus.DELIVERED) ? OrderStatus.DELIVERED : statuses.every((status) => status === FulfillmentStatus.CANCELLED) ? OrderStatus.CANCELLED : statuses.some((status) => status === FulfillmentStatus.SHIPPED || status === FulfillmentStatus.DELIVERED) ? OrderStatus.SHIPPED : statuses.some((status) => status === FulfillmentStatus.PROCESSING) ? OrderStatus.PROCESSING : OrderStatus.PENDING;
  await tx.order.update({ where: { id: orderId }, data: { status: next } });
};

export const listSellerFulfillments = async (sellerId: string) => (await prisma.fulfillment.findMany({ where: { sellerId }, select, orderBy: { createdAt: "desc" } })).map(map);
export const getSellerFulfillment = async (sellerId: string, id: string) => { const fulfillment = await prisma.fulfillment.findFirst({ where: { id, sellerId }, select }); if (!fulfillment) throw new ApiError(404, "Fulfillment not found", "FULFILLMENT_NOT_FOUND"); return map(fulfillment); };

export const updateSellerFulfillment = async (sellerId: string, id: string, input: { status?: FulfillmentStatus; trackingNumber?: string; carrier?: string }) => {
  const current = await prisma.fulfillment.findFirst({ where: { id, sellerId }, select: { id: true, orderId: true, status: true, trackingNumber: true } });
  if (!current) throw new ApiError(404, "Fulfillment not found", "FULFILLMENT_NOT_FOUND");
  const status = input.status ?? current.status;
  if (input.status && input.status !== current.status && !transitions[current.status].includes(input.status)) throw new ApiError(409, `Cannot move fulfillment from ${current.status} to ${input.status}`, "INVALID_FULFILLMENT_TRANSITION");
  if (status === FulfillmentStatus.SHIPPED && !(input.trackingNumber || current.trackingNumber)) throw new ApiError(400, "Tracking number is required before shipping", "TRACKING_REQUIRED");
  const updated = await prisma.$transaction(async (tx) => { const now = new Date(); await tx.fulfillment.update({ where: { id }, data: { ...(input.status ? { status } : {}), ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber || null } : {}), ...(input.carrier !== undefined ? { carrier: input.carrier || null } : {}), ...(status === FulfillmentStatus.SHIPPED ? { shippedAt: current.status === FulfillmentStatus.SHIPPED ? undefined : now } : {}), ...(status === FulfillmentStatus.DELIVERED ? { deliveredAt: current.status === FulfillmentStatus.DELIVERED ? undefined : now } : {}) } }); await syncOrderStatus(tx, current.orderId); return tx.fulfillment.findUniqueOrThrow({ where: { id }, select }); });
  return map(updated);
};

export const getCustomerFulfillments = async (userId: string, orderId: string) => { const order = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true } }); if (!order) throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND"); return (await prisma.fulfillment.findMany({ where: { orderId }, select, orderBy: { createdAt: "asc" } })).map(map); };
export const listAdminFulfillments = async (input: { page?: number; pageSize?: number; status?: FulfillmentStatus } = {}) => {
  const page = input.page ?? 1; const pageSize = Math.min(input.pageSize ?? 25, 100); const where = input.status ? { status: input.status } : {};
  const [items, total] = await Promise.all([
    prisma.fulfillment.findMany({ where, select, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.fulfillment.count({ where }),
  ]);
  return { items: items.map(map), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
};
export const updateAdminFulfillment = async (id: string, input: { status?: FulfillmentStatus; trackingNumber?: string; carrier?: string }) => updateSellerFulfillment("", id, input).catch(async (error) => { if (!(error instanceof ApiError && error.code === "FULFILLMENT_NOT_FOUND")) throw error; const current = await prisma.fulfillment.findUnique({ where: { id }, select: { id: true, orderId: true, status: true, trackingNumber: true } }); if (!current) throw error; const status = input.status ?? current.status; if (input.status && input.status !== current.status && !transitions[current.status].includes(input.status)) throw new ApiError(409, "Invalid fulfillment transition", "INVALID_FULFILLMENT_TRANSITION"); const updated = await prisma.$transaction(async (tx) => { const now = new Date(); await tx.fulfillment.update({ where: { id }, data: { ...(input.status ? { status } : {}), ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber || null } : {}), ...(input.carrier !== undefined ? { carrier: input.carrier || null } : {}), ...(status === FulfillmentStatus.SHIPPED ? { shippedAt: current.status === FulfillmentStatus.SHIPPED ? undefined : now } : {}), ...(status === FulfillmentStatus.DELIVERED ? { deliveredAt: current.status === FulfillmentStatus.DELIVERED ? undefined : now } : {}) } }); await syncOrderStatus(tx, current.orderId); return tx.fulfillment.findUniqueOrThrow({ where: { id }, select }); }); return map(updated); });
