import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { recommendations, recentlyViewed } from "../services/recommendation.service.js";

const querySchema = z.object({ limit: z.coerce.number().int().min(1).max(20).default(12) });
export const getRecommendations: RequestHandler = asyncHandler(async (request, response) => { const { limit } = querySchema.parse(request.query); response.json({ success: true, data: await recommendations(request.auth!.userId, limit) }); });
export const getRecentlyViewed: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: await recentlyViewed(request.auth!.userId) }); });
