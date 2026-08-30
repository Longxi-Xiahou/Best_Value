import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { suggestions } from "../services/search.service.js";
import { z } from "zod";

const querySchema = z.object({ q: z.string().trim().max(50).default("") });
export const getSuggestions: RequestHandler = asyncHandler(async (request, response) => { const { q } = querySchema.parse(request.query); response.json({ success: true, data: await suggestions(q) }); });
