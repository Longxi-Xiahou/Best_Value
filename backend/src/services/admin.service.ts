import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const pagination = (page: number, pageSize: number, total: number) => ({ page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
const money = (value: Prisma.Decimal | null | undefined) => Number(value ?? 0);

export const getAdminDashboard = async () => {
  const nonCancelled = { status: { not: "CANCELLED" as const } };
  const [totalUsers, totalSellers, activeProducts, pendingOrders, paidOrders, pendingPayments, activeFulfillments, pendingReviewReports, orderValue, allocations] = await prisma.$transaction([
    prisma.user.count(), prisma.seller.count(), prisma.product.count({ where: { status: "ACTIVE" } }), prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { paymentStatus: "SUCCEEDED" } }), prisma.payment.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.fulfillment.count({ where: { status: { in: ["PENDING", "PROCESSING", "SHIPPED"] } } }), prisma.reviewReport.count({ where: { status: "OPEN" } }),
    prisma.order.aggregate({ where: nonCancelled, _sum: { totalAmount: true } }),
    prisma.sellerOrderAllocation.aggregate({ where: { order: nonCancelled }, _sum: { platformFeeAmount: true, sellerNetAmount: true } }),
  ]);
  return { totalUsers, totalSellers, activeProducts, pendingOrders, paidOrders, pendingPayments, activeFulfillments, pendingReviewReports, totalOrderValue: money(orderValue._sum.totalAmount), platformFees: money(allocations._sum.platformFeeAmount), sellerNetAmount: money(allocations._sum.sellerNetAmount) };
};

export const listAdminUsers = async (input: { page: number; pageSize: number; search?: string; role?: "CUSTOMER" | "SELLER" | "ADMIN" }) => {
  const where: Prisma.UserWhereInput = { ...(input.role ? { role: input.role } : {}), ...(input.search ? { OR: [{ email: { contains: input.search } }, { firstName: { contains: input.search } }, { lastName: { contains: input.search } }] } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, seller: { select: { id: true, storeName: true, status: true } }, _count: { select: { orders: true, reviews: true } } } }),
    prisma.user.count({ where }),
  ]);
  return { items, pagination: pagination(input.page, input.pageSize, total) };
};

export const listAdminSellers = async (input: { page: number; pageSize: number; search?: string; status?: "PENDING" | "ACTIVE" | "SUSPENDED" }) => {
  const where: Prisma.SellerWhereInput = { ...(input.status ? { status: input.status } : {}), ...(input.search ? { OR: [{ storeName: { contains: input.search } }, { slug: { contains: input.search } }, { user: { email: { contains: input.search } } }] } : {}) };
  const [items, total, allocationTotals] = await prisma.$transaction([
    prisma.seller.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, storeName: true, slug: true, description: true, status: true, createdAt: true, user: { select: { email: true, firstName: true, lastName: true } }, _count: { select: { products: true, orderItems: true } } } }),
    prisma.seller.count({ where }),
    prisma.sellerOrderAllocation.groupBy({ by: ["sellerId"], where: { seller: where }, orderBy: { sellerId: "asc" }, _sum: { grossAmount: true, platformFeeAmount: true, sellerNetAmount: true } }),
  ]);
  const totals = new Map(allocationTotals.map((row) => [row.sellerId, { grossAmount: money(row._sum?.grossAmount), platformFeeAmount: money(row._sum?.platformFeeAmount), sellerNetAmount: money(row._sum?.sellerNetAmount) }]));
  return { items: items.map((seller) => ({ ...seller, transactionSummary: totals.get(seller.id) ?? { grossAmount: 0, platformFeeAmount: 0, sellerNetAmount: 0 } })), pagination: pagination(input.page, input.pageSize, total) };
};

export const getAdminSeller = async (sellerId: string) => {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId }, select: { id: true, storeName: true, slug: true, description: true, status: true, createdAt: true, user: { select: { id: true, email: true, firstName: true, lastName: true, createdAt: true } }, _count: { select: { products: true, orderItems: true, fulfillments: true } } } });
  if (!seller) throw new ApiError(404, "Seller not found", "SELLER_NOT_FOUND");
  const totals = await prisma.sellerOrderAllocation.aggregate({ where: { sellerId }, _sum: { grossAmount: true, platformFeeAmount: true, sellerNetAmount: true } });
  return { ...seller, transactionSummary: { grossAmount: money(totals._sum.grossAmount), platformFeeAmount: money(totals._sum.platformFeeAmount), sellerNetAmount: money(totals._sum.sellerNetAmount) } };
};

export const listModerationProducts = async (input: { page: number; pageSize: number; search?: string; status?: ProductStatus; sellerId?: string; categoryId?: string }) => {
  const where: Prisma.ProductWhereInput = { ...(input.status ? { status: input.status } : {}), ...(input.sellerId ? { sellerId: input.sellerId } : {}), ...(input.categoryId ? { categoryId: input.categoryId } : {}), ...(input.search ? { OR: [{ title: { contains: input.search } }, { slug: { contains: input.search } }, { brand: { contains: input.search } }] } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ where, select: { id: true, title: true, slug: true, status: true, basePrice: true, createdAt: true, seller: { select: { id: true, storeName: true, status: true } }, category: { select: { id: true, name: true, slug: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (input.page - 1) * input.pageSize, take: input.pageSize }),
    prisma.product.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...item, basePrice: Number(item.basePrice) })), pagination: pagination(input.page, input.pageSize, total) };
};

export const getAdminProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, title: true, slug: true, description: true, brand: true, basePrice: true, currency: true, stockQuantity: true, status: true, createdAt: true, updatedAt: true, seller: { select: { id: true, storeName: true, status: true } }, category: { select: { id: true, name: true, slug: true } }, images: { select: { url: true, altText: true, position: true }, orderBy: { position: "asc" } }, variants: { select: { id: true, sku: true, price: true, stockQuantity: true } } } });
  if (!product) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  return { ...product, basePrice: Number(product.basePrice), variants: product.variants.map((variant) => ({ ...variant, price: variant.price === null ? null : Number(variant.price) })) };
};

export const moderateProduct = async (productId: string, status: ProductStatus) => {
  const product = await prisma.product.updateMany({ where: { id: productId }, data: { status } });
  if (product.count !== 1) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  return prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { id: true, title: true, status: true } });
};

export const listAdminOrders = async (input: { page: number; pageSize: number; search?: string; status?: string; paymentStatus?: string }) => {
  const where: Prisma.OrderWhereInput = { ...(input.status ? { status: input.status as Prisma.EnumOrderStatusFilter } : {}), ...(input.paymentStatus ? { paymentStatus: input.paymentStatus as Prisma.EnumPaymentStatusFilter } : {}), ...(input.search ? { OR: [{ id: { contains: input.search } }, { user: { email: { contains: input.search } } }] } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, status: true, paymentStatus: true, currency: true, totalAmount: true, createdAt: true, user: { select: { id: true, email: true, firstName: true, lastName: true } }, _count: { select: { items: true, payments: true, fulfillments: true } } } }),
    prisma.order.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...item, totalAmount: Number(item.totalAmount) })), pagination: pagination(input.page, input.pageSize, total) };
};

export const getAdminOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, paymentStatus: true, paymentProvider: true, paymentRef: true, currency: true, subtotalAmount: true, shippingAmount: true, taxAmount: true, totalAmount: true, shippingAddress: true, createdAt: true, updatedAt: true, user: { select: { id: true, email: true, firstName: true, lastName: true } }, items: { select: { id: true, productId: true, variantId: true, sellerId: true, productName: true, variantName: true, sku: true, quantity: true, unitPrice: true, totalPrice: true, seller: { select: { id: true, storeName: true } } } }, allocations: { select: { id: true, sellerId: true, grossAmount: true, platformFeeAmount: true, sellerNetAmount: true, feeRate: true, seller: { select: { id: true, storeName: true } } } }, payments: { select: { id: true, provider: true, providerPaymentId: true, checkoutSessionId: true, status: true, amount: true, currency: true, createdAt: true, refunds: { select: { id: true, providerRefundId: true, amount: true, currency: true, status: true, reason: true, createdAt: true } } } }, fulfillments: { select: { id: true, sellerId: true, status: true, trackingNumber: true, carrier: true, shippedAt: true, deliveredAt: true, seller: { select: { id: true, storeName: true } } } } } });
  if (!order) throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  return { ...order, subtotalAmount: Number(order.subtotalAmount), shippingAmount: Number(order.shippingAmount), taxAmount: Number(order.taxAmount), totalAmount: Number(order.totalAmount), items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), totalPrice: Number(item.totalPrice) })), allocations: order.allocations.map((allocation) => ({ ...allocation, grossAmount: Number(allocation.grossAmount), platformFeeAmount: Number(allocation.platformFeeAmount), sellerNetAmount: Number(allocation.sellerNetAmount), feeRate: Number(allocation.feeRate) })), payments: order.payments.map((payment) => ({ ...payment, amount: Number(payment.amount), refunds: payment.refunds.map((refund) => ({ ...refund, amount: Number(refund.amount) })) })) };
};

export const listAdminAuditLogs = async (input: { page: number; pageSize: number; action?: string; targetType?: string }) => {
  const where: Prisma.AdminAuditLogWhereInput = { ...(input.action ? { action: input.action } : {}), ...(input.targetType ? { targetType: input.targetType } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.adminAuditLog.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, action: true, targetType: true, targetId: true, metadata: true, createdAt: true, adminUser: { select: { id: true, email: true, firstName: true, lastName: true } } } }),
    prisma.adminAuditLog.count({ where }),
  ]);
  return { items, pagination: pagination(input.page, input.pageSize, total) };
};
