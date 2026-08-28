import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { listSellerTransactions } from "../services/payment.service.js";

export const transactions: RequestHandler = asyncHandler(async (request, response) => { response.json({ success: true, data: { items: await listSellerTransactions(request.seller!.id) } }); });
