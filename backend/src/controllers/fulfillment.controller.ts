import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { fulfillmentParamsSchema, fulfillmentUpdateSchema } from "../validators/shipping.validation.js";
import { getSellerFulfillment, listSellerFulfillments, updateSellerFulfillment } from "../services/fulfillment.service.js";

export const list: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: { items: await listSellerFulfillments(request.seller!.id) } }); });
export const detail: RequestHandler = asyncHandler(async (request, response) => { const { id } = fulfillmentParamsSchema.parse(request.params); response.json({ success: true, data: { fulfillment: await getSellerFulfillment(request.seller!.id, id) } }); });
export const update: RequestHandler = asyncHandler(async (request, response) => { const { id } = fulfillmentParamsSchema.parse(request.params); const input = fulfillmentUpdateSchema.parse(request.body); response.json({ success: true, data: { fulfillment: await updateSellerFulfillment(request.seller!.id, id, input) } }); });
