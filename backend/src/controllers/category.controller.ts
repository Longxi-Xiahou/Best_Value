import type { RequestHandler } from "express";
import { getCategoryBySlug, listCategories } from "../services/category.service.js";
import { listProducts } from "../services/product.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { categoryParamsSchema, listProductsQuerySchema } from "../validators/catalog.validation.js";

export const getCategories: RequestHandler = asyncHandler(async (_request, response) => {
  response.status(200).json({ success: true, data: { items: await listCategories() } });
});

export const getCategory: RequestHandler = asyncHandler(async (request, response) => {
  const { slug } = categoryParamsSchema.parse(request.params);
  response.status(200).json({ success: true, data: { category: await getCategoryBySlug(slug) } });
});

export const getCategoryProducts: RequestHandler = asyncHandler(async (request, response) => {
  const { slug } = categoryParamsSchema.parse(request.params);
  const query = listProductsQuerySchema.parse({ ...request.query, category: slug, categoryId: undefined });
  response.status(200).json({ success: true, data: await listProducts(query) });
});
