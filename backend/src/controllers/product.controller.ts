import type { RequestHandler } from "express";
import { getProductById, listProducts } from "../services/product.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { listProductsQuerySchema, productParamsSchema } from "../validators/catalog.validation.js";

export const getProducts: RequestHandler = asyncHandler(async (request, response) => {
  const query = listProductsQuerySchema.parse(request.query);
  response.status(200).json({ success: true, data: await listProducts(query) });
});

export const getProduct: RequestHandler = asyncHandler(async (request, response) => {
  const { id } = productParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { product: await getProductById(id) } });
});
