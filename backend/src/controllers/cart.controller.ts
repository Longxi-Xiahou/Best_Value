import type { RequestHandler } from "express";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../services/cart.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { cartItemInputSchema, cartItemParamsSchema, updateCartItemSchema } from "../validators/commerce.validation.js";
import { recordProductInteraction } from "../services/interaction.service.js";
import { ProductInteractionType } from "@prisma/client";

export const getCurrentCart: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ success: true, data: await getCart(request.auth!.userId) });
});

export const addItem: RequestHandler = asyncHandler(async (request, response) => {
  const input = cartItemInputSchema.parse(request.body);
  const cart = await addCartItem(request.auth!.userId, input.productId, input.variantId, input.quantity);
  await recordProductInteraction(request.auth!.userId, input.productId, ProductInteractionType.ADD_TO_CART);
  response.status(201).json({ success: true, data: cart });
});

export const updateItem: RequestHandler = asyncHandler(async (request, response) => {
  const { id } = cartItemParamsSchema.parse(request.params);
  const { quantity } = updateCartItemSchema.parse(request.body);
  response.json({ success: true, data: await updateCartItem(request.auth!.userId, id, quantity) });
});

export const removeItem: RequestHandler = asyncHandler(async (request, response) => {
  const { id } = cartItemParamsSchema.parse(request.params);
  response.json({ success: true, data: await removeCartItem(request.auth!.userId, id) });
});

export const deleteCart: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ success: true, data: await clearCart(request.auth!.userId) });
});
