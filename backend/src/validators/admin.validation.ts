import { z } from "zod";

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(25);
const search = z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().min(1).max(191).optional());
const id = z.string().cuid("Invalid ID");

export const adminPaginationSchema = z.object({ page, pageSize });
export const adminUsersQuerySchema = adminPaginationSchema.extend({ search, role: z.enum(["CUSTOMER", "SELLER", "ADMIN"]).optional() });
export const adminSellersQuerySchema = adminPaginationSchema.extend({ search, status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional() });
export const adminProductsQuerySchema = adminPaginationSchema.extend({ search, status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(), sellerId: id.optional(), categoryId: id.optional() });
export const adminOrdersQuerySchema = adminPaginationSchema.extend({ search, status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(), paymentStatus: z.enum(["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional() });
export const adminPaymentsQuerySchema = adminPaginationSchema.extend({ status: z.enum(["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional() });
export const adminFulfillmentsQuerySchema = adminPaginationSchema.extend({ status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional() });
export const adminAuditLogsQuerySchema = adminPaginationSchema.extend({ action: z.string().trim().min(1).max(100).optional(), targetType: z.string().trim().min(1).max(80).optional() });
export const adminIdParamsSchema = z.object({ id });

