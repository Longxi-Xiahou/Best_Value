import type { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const requireSeller: RequestHandler = asyncHandler(async (request, _response, next) => {
  const userId = request.auth?.userId;
  if (!userId) throw new ApiError(401, "Authentication is required", "UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, seller: { select: { id: true, status: true } } } });
  if (!user?.seller || (user.role !== "SELLER" && user.role !== "ADMIN")) throw new ApiError(403, "Seller access is required", "SELLER_ACCESS_REQUIRED");
  if (user.seller.status === "SUSPENDED") throw new ApiError(403, "This seller account is suspended", "SELLER_SUSPENDED");
  request.seller = user.seller;
  next();
});

export const requireAdmin: RequestHandler = asyncHandler(async (request, _response, next) => {
  const userId = request.auth?.userId;
  if (!userId) throw new ApiError(401, "Authentication is required", "UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") throw new ApiError(403, "Administrator access is required", "ADMIN_ACCESS_REQUIRED");
  next();
});
