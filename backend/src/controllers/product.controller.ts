import type { RequestHandler } from "express";
import { getProductById } from "../services/product.service.js";
import { listProducts, recordSearchEvent, relatedProducts, trendingProducts } from "../services/search.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { listProductsQuerySchema, productParamsSchema } from "../validators/catalog.validation.js";

export const getProducts: RequestHandler = asyncHandler(async (request, response) => {
  const query = listProductsQuerySchema.parse(request.query);
  await recordSearchEvent(query.q ?? query.search, request.auth?.userId);
  response.status(200).json({ success: true, data: await listProducts(query) });
});

export const getProduct: RequestHandler = asyncHandler(async (request, response) => {
  const { id } = productParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { product: await getProductById(id) } });
});

export const getRelated: RequestHandler = asyncHandler(async (request, response) => {
  const { id } = productParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: await relatedProducts(id) });
});

export const getTrending: RequestHandler = asyncHandler(async (_request, response) => {
  response.status(200).json({ success: true, data: await trendingProducts() });
});
