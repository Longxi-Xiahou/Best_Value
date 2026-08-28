import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { paymentOrderSchema } from "../validators/payment.validation.js";
import { createCheckoutSession, processStripeWebhook } from "../services/payment.service.js";

export const checkoutSession: RequestHandler = asyncHandler(async (request, response) => {
  const { orderId } = paymentOrderSchema.parse(request.body);
  response.status(201).json({ success: true, data: await createCheckoutSession(request.auth!.userId, orderId) });
});

export const webhook: RequestHandler = asyncHandler(async (request, response) => {
  const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from(request.body as string);
  const result = await processStripeWebhook(rawBody, request.header("stripe-signature"));
  response.json({ success: true, data: result });
});
