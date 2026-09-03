import type { RequestHandler } from "express";
import { ProductStatus } from "@prisma/client";
import { asyncHandler } from "../utils/async-handler.js";
import { recordAdminAudit } from "../services/admin-audit.service.js";
import { getAdminDashboard, getAdminOrder, getAdminProduct, getAdminSeller, listAdminAuditLogs, listAdminOrders, listAdminSellers, listAdminUsers, listModerationProducts, moderateProduct } from "../services/admin.service.js";
import { adminAuditLogsQuerySchema, adminIdParamsSchema, adminOrdersQuerySchema, adminProductsQuerySchema, adminSellersQuerySchema, adminUsersQuerySchema } from "../validators/admin.validation.js";
import { z } from "zod";

export const dashboard: RequestHandler = asyncHandler(async (_request, response) => { response.json({ success: true, data: await getAdminDashboard() }); });
export const users: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await listAdminUsers(adminUsersQuerySchema.parse(request.query)) }); });
export const sellers: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await listAdminSellers(adminSellersQuerySchema.parse(request.query)) }); });
export const seller: RequestHandler = asyncHandler(async (request, response) => { const { id } = adminIdParamsSchema.parse(request.params); response.json({ success: true, data: { seller: await getAdminSeller(id) } }); });
export const products: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await listModerationProducts(adminProductsQuerySchema.parse(request.query)) }); });
export const product: RequestHandler = asyncHandler(async (request, response) => { const { id } = adminIdParamsSchema.parse(request.params); response.json({ success: true, data: { product: await getAdminProduct(id) } }); });
export const updateStatus: RequestHandler = asyncHandler(async (request, response) => { const { id } = adminIdParamsSchema.parse(request.params); const { status } = z.object({ status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) }).parse(request.body); const updated = await moderateProduct(id, status as ProductStatus); await recordAdminAudit(request.auth!.userId, status === "ACTIVE" ? "PRODUCT_PUBLISHED" : status === "ARCHIVED" ? "PRODUCT_ARCHIVED" : "PRODUCT_HIDDEN", "PRODUCT", id, { status }); response.json({ success: true, data: { product: updated } }); });
export const orders: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await listAdminOrders(adminOrdersQuerySchema.parse(request.query)) }); });
export const order: RequestHandler = asyncHandler(async (request, response) => { const { id } = adminIdParamsSchema.parse(request.params); response.json({ success: true, data: { order: await getAdminOrder(id) } }); });
export const auditLogs: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await listAdminAuditLogs(adminAuditLogsQuerySchema.parse(request.query)) }); });
