import type { RequestHandler } from "express";
import { createProductReview, deleteProductReview, listProductReviews, updateProductReview } from "../services/review.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { productParamsSchema } from "../validators/catalog.validation.js";
import { reviewCreateSchema, reviewParamsSchema, reviewUpdateSchema } from "../validators/seller.validation.js";

export const list: RequestHandler = asyncHandler(async (request, response) => { const { id } = productParamsSchema.parse(request.params); response.json({ success: true, data: await listProductReviews(id) }); });
export const create: RequestHandler = asyncHandler(async (request, response) => { const { id } = productParamsSchema.parse(request.params); response.status(201).json({ success: true, data: { review: await createProductReview(request.auth!.userId, id, reviewCreateSchema.parse(request.body)) } }); });
export const update: RequestHandler = asyncHandler(async (request, response) => { const { id } = reviewParamsSchema.parse(request.params); response.json({ success: true, data: { review: await updateProductReview(request.auth!.userId, id, reviewUpdateSchema.parse(request.body)) } }); });
export const remove: RequestHandler = asyncHandler(async (request, response) => { const { id } = reviewParamsSchema.parse(request.params); await deleteProductReview(request.auth!.userId, id); response.json({ success: true, data: { message: "Review deleted" } }); });
