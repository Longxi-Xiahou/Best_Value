import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { paymentOrderParamsSchema, refundSchema } from "../validators/payment.validation.js";
import { listAdminAllocations, listAdminPayments, refundOrder } from "../services/payment.service.js";

export const payments: RequestHandler = asyncHandler(async (_request, response) => { response.json({ success: true, data: { items: await listAdminPayments() } }); });
export const allocations: RequestHandler = asyncHandler(async (_request, response) => { response.json({ success: true, data: { items: await listAdminAllocations() } }); });
export const refund: RequestHandler = asyncHandler(async (request, response) => { const { id } = paymentOrderParamsSchema.parse(request.params); const input = refundSchema.parse(request.body); response.status(201).json({ success: true, data: { refund: await refundOrder(id, input.amount, input.reason) } }); });
