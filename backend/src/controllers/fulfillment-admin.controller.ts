import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { fulfillmentParamsSchema, fulfillmentUpdateSchema } from "../validators/shipping.validation.js";
import { listAdminFulfillments, updateAdminFulfillment } from "../services/fulfillment.service.js";
import { recordAdminAudit } from "../services/admin-audit.service.js";
import { adminFulfillmentsQuerySchema } from "../validators/admin.validation.js";

export const list: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await listAdminFulfillments(adminFulfillmentsQuerySchema.parse(request.query)) }); });
export const update: RequestHandler = asyncHandler(async (request, response) => { const { id } = fulfillmentParamsSchema.parse(request.params); const input = fulfillmentUpdateSchema.parse(request.body); const fulfillment = await updateAdminFulfillment(id, input); await recordAdminAudit(request.auth!.userId, "FULFILLMENT_STATUS_CHANGED", "FULFILLMENT", id, { status: fulfillment.status, trackingNumber: fulfillment.trackingNumber, carrier: fulfillment.carrier }); response.json({ success: true, data: { fulfillment } }); });
