import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { paymentOrderParamsSchema, refundSchema } from "../validators/payment.validation.js";
import { listAdminAllocations, listAdminPayments, refundOrder } from "../services/payment.service.js";
import { recordAdminAudit } from "../services/admin-audit.service.js";
import { adminPaymentsQuerySchema } from "../validators/admin.validation.js";

export const payments: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await listAdminPayments(adminPaymentsQuerySchema.parse(request.query)) }); });
export const allocations: RequestHandler = asyncHandler(async (_request, response) => { response.json({ success: true, data: { items: await listAdminAllocations() } }); });
export const refund: RequestHandler = asyncHandler(async (request, response) => { const { id } = paymentOrderParamsSchema.parse(request.params); const input = refundSchema.parse(request.body); const created = await refundOrder(id, input.amount, input.reason); await recordAdminAudit(request.auth!.userId, "REFUND_CREATED", "ORDER", id, { refundId: created.id, amount: created.amount, status: created.status }); response.status(201).json({ success: true, data: { refund: created } }); });
