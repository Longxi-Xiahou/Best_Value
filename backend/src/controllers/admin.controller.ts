import type { RequestHandler } from "express";
import { listModerationProducts, moderateProduct } from "../services/admin.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { productParamsSchema } from "../validators/catalog.validation.js";
import { z } from "zod";

export const products: RequestHandler = asyncHandler(async (_request, response) => { response.json({ success: true, data: { items: await listModerationProducts() } }); });
export const updateStatus: RequestHandler = asyncHandler(async (request, response) => { const { id } = productParamsSchema.parse(request.params); const { status } = z.object({ status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) }).parse(request.body); response.json({ success: true, data: { product: await moderateProduct(id, status) } }); });
