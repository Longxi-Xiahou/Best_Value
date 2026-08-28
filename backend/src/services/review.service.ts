import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const reviewSelect = { id: true, rating: true, title: true, body: true, createdAt: true, updatedAt: true, user: { select: { firstName: true, lastName: true } } } satisfies Prisma.ReviewSelect;
const publicReview = (review: Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>) => ({ ...review, author: [review.user.firstName, review.user.lastName].filter(Boolean).join(" ") || "Customer", user: undefined });

export const listProductReviews = async (productId: string) => {
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  const reviews = await prisma.review.findMany({ where: { productId }, select: reviewSelect, orderBy: { createdAt: "desc" } });
  return { averageRating: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0, reviewCount: reviews.length, items: reviews.map(publicReview) };
};

export const createProductReview = async (userId: string, productId: string, input: { rating: number; title?: string; body: string }) => {
  const purchased = await prisma.orderItem.findFirst({ where: { productId, order: { userId } }, select: { id: true } });
  if (!purchased) throw new ApiError(403, "You can only review products you have purchased", "PURCHASE_REQUIRED");
  try {
    const review = await prisma.review.create({ data: { userId, productId, rating: input.rating, title: input.title || null, body: input.body }, select: reviewSelect });
    return publicReview(review);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "You have already reviewed this product", "REVIEW_ALREADY_EXISTS");
    throw error;
  }
};

export const updateProductReview = async (userId: string, reviewId: string, input: Partial<{ rating: number; title?: string; body: string }>) => {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId }, select: { id: true } });
  if (!review) throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
  return publicReview(await prisma.review.update({ where: { id: reviewId }, data: input, select: reviewSelect }));
};

export const deleteProductReview = async (userId: string, reviewId: string) => {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId }, select: { id: true } });
  if (!review) throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
  await prisma.review.delete({ where: { id: reviewId } });
};
