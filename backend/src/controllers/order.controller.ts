import type { RequestHandler } from "express";
import { createOrderSchema, orderParamsSchema } from "../validators/commerce.validation.js";
import { createOrder, getOrder, listOrders } from "../services/order.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const create: RequestHandler = asyncHandler(async (request, response) => {
  const { shippingAddress, shippingMethodId } = createOrderSchema.parse(request.body);
  response.status(201).json({ success: true, data: { order: await createOrder(request.auth!.userId, shippingAddress, shippingMethodId) } });
});

export const list: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { items: await listOrders(request.auth!.userId) } });
});

export const detail: RequestHandler = asyncHandler(async (request, response) => {
  const { id } = orderParamsSchema.parse(request.params);
  response.json({ success: true, data: { order: await getOrder(request.auth!.userId, id) } });
});
