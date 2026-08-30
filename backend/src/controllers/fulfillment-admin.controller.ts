import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { fulfillmentParamsSchema, fulfillmentUpdateSchema } from "../validators/shipping.validation.js";
import { listAdminFulfillments, updateAdminFulfillment } from "../services/fulfillment.service.js";

export const list: RequestHandler = asyncHandler(async (_request, response) => { response.json({ success: true, data: { items: await listAdminFulfillments() } }); });
export const update: RequestHandler = asyncHandler(async (request, response) => { const { id } = fulfillmentParamsSchema.parse(request.params); const input = fulfillmentUpdateSchema.parse(request.body); response.json({ success: true, data: { fulfillment: await updateAdminFulfillment(id, input) } }); });
