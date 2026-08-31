import { Prisma, ReviewModerationActionType, ReviewReportStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const reviewSelect = {
  id: true, rating: true, title: true, body: true, verifiedPurchase: true, createdAt: true, updatedAt: true,
  user: { select: { firstName: true, lastName: true } },
} satisfies Prisma.ReviewSelect;
type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;

const publicReview = (review: ReviewRow) => ({
  id: review.id, rating: review.rating, title: review.title, body: review.body ?? "", verifiedPurchase: review.verifiedPurchase,
  createdAt: review.createdAt, updatedAt: review.updatedAt,
  author: [review.user.firstName, review.user.lastName].filter(Boolean).join(" ") || "Customer",
});

const roundRating = (value: number | null | undefined) => value == null ? 0 : Math.round(value * 10) / 10;
const ratingDistribution = (rows: Array<{ rating: number; _count: { _all: number } }>) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  rows.forEach((row) => { if (row.rating >= 1 && row.rating <= 5) distribution[row.rating as 1 | 2 | 3 | 4 | 5] = row._count._all; });
  return distribution;
};
export const getReviewStatistics = async (productId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) => {
  const where: Prisma.ReviewWhereInput = { productId, status: ReviewStatus.PUBLISHED };
  const [aggregate, grouped] = await Promise.all([
    tx.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
    tx.review.groupBy({ by: ["rating"], where, _count: { _all: true } }),
  ]);
  return { averageRating: roundRating(aggregate._avg.rating), reviewCount: aggregate._count._all, distribution: ratingDistribution(grouped) };
};

export const listProductReviews = async (productId: string, options: { page?: number; pageSize?: number; sort?: "newest" | "oldest" | "highest" | "lowest"; verified?: boolean } = {}) => {
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  const page = options.page ?? 1; const pageSize = Math.min(options.pageSize ?? 10, 50);
  const where: Prisma.ReviewWhereInput = { productId, status: ReviewStatus.PUBLISHED, ...(options.verified === undefined ? {} : { verifiedPurchase: options.verified }) };
  const orderBy: Prisma.ReviewOrderByWithRelationInput[] = options.sort === "oldest" ? [{ createdAt: "asc" }, { id: "asc" }] : options.sort === "highest" ? [{ rating: "desc" }, { createdAt: "desc" }, { id: "desc" }] : options.sort === "lowest" ? [{ rating: "asc" }, { createdAt: "desc" }, { id: "desc" }] : [{ createdAt: "desc" }, { id: "desc" }];
  const [reviews, total, statistics] = await Promise.all([
    prisma.review.findMany({ where, select: reviewSelect, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.review.count({ where }),
    getReviewStatistics(productId),
  ]);
  return { ...statistics, items: reviews.map(publicReview), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
};

const deliveredPurchase = (userId: string, productId: string) => prisma.orderItem.findFirst({
  where: { productId, order: { userId, status: { notIn: ["CANCELLED", "REFUNDED"] } }, fulfillmentItems: { some: { fulfillment: { status: "DELIVERED" } } } },
  select: { id: true },
});

export const createProductReview = async (userId: string, productId: string, input: { rating: number; title?: string; body: string }) => {
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  if (!await deliveredPurchase(userId, productId)) throw new ApiError(403, "Reviews are available after a delivered purchase", "PURCHASE_REQUIRED");
  try {
    const review = await prisma.review.create({ data: { userId, productId, rating: input.rating, title: input.title || null, body: input.body, verifiedPurchase: true }, select: reviewSelect });
    return publicReview(review);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "You have already reviewed this product", "REVIEW_ALREADY_EXISTS");
    throw error;
  }
};

export const updateProductReview = async (userId: string, reviewId: string, input: Partial<{ rating: number; title?: string; body: string }>) => {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId }, select: { id: true, status: true } });
  if (!review) throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
  if (review.status !== ReviewStatus.PUBLISHED) throw new ApiError(409, "This review is not editable while moderated", "REVIEW_MODERATED");
  return publicReview(await prisma.review.update({ where: { id: reviewId }, data: { ...(input.rating === undefined ? {} : { rating: input.rating }), ...(input.title === undefined ? {} : { title: input.title || null }), ...(input.body === undefined ? {} : { body: input.body }) }, select: reviewSelect }));
};

export const deleteProductReview = async (userId: string, reviewId: string) => {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId }, select: { id: true } });
  if (!review) throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
  await prisma.review.update({ where: { id: reviewId }, data: { status: ReviewStatus.REMOVED } });
};

export const reportReview = async (reporterUserId: string, reviewId: string, input: { reason: "SPAM" | "HARASSMENT" | "OFF_TOPIC" | "FAKE_REVIEW" | "INAPPROPRIATE" | "OTHER"; details?: string }) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true, status: true } });
  if (!review || review.status !== ReviewStatus.PUBLISHED) throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
  if (review.userId === reporterUserId) throw new ApiError(400, "You cannot report your own review", "SELF_REPORT_NOT_ALLOWED");
  try { return await prisma.reviewReport.create({ data: { reviewId, reporterUserId, reason: input.reason, details: input.details || null } }); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "You have already reported this review", "REPORT_ALREADY_EXISTS"); throw error; }
};

export const listAdminReviews = async (options: { status?: ReviewStatus; page?: number; pageSize?: number } = {}) => {
  const page = options.page ?? 1; const pageSize = Math.min(options.pageSize ?? 25, 100); const where: Prisma.ReviewWhereInput = options.status ? { status: options.status } : {};
  const [items, total] = await Promise.all([
    prisma.review.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize, select: { ...reviewSelect, status: true, product: { select: { id: true, title: true } }, reports: { select: { id: true, reason: true, status: true, details: true, createdAt: true, reporter: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } } } }),
    prisma.review.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...publicReview(item), status: item.status, product: item.product, reports: item.reports.map((report) => ({ ...report, reporter: [report.reporter.firstName, report.reporter.lastName].filter(Boolean).join(" ") || "Customer" })) })), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
};

export const listReviewReports = async (options: { status?: ReviewReportStatus; page?: number; pageSize?: number } = {}) => {
  const page = options.page ?? 1; const pageSize = Math.min(options.pageSize ?? 25, 100); const where: Prisma.ReviewReportWhereInput = options.status ? { status: options.status } : {};
  const [items, total] = await Promise.all([
    prisma.reviewReport.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize, select: { id: true, reason: true, details: true, status: true, createdAt: true, resolvedAt: true, review: { select: { id: true, product: { select: { id: true, title: true } }, rating: true, body: true, status: true } }, reporter: { select: { firstName: true, lastName: true } } } }),
    prisma.reviewReport.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...item, reporter: [item.reporter.firstName, item.reporter.lastName].filter(Boolean).join(" ") || "Customer" })), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
};

export const moderateReview = async (adminUserId: string, reviewId: string, action: ReviewModerationActionType, reason?: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, status: true } });
  if (!review) throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
  const nextStatus: Record<ReviewModerationActionType, ReviewStatus> = { HIDE: ReviewStatus.HIDDEN, RESTORE: ReviewStatus.PUBLISHED, REMOVE: ReviewStatus.REMOVED };
  const updated = await prisma.$transaction(async (tx) => { await tx.review.update({ where: { id: reviewId }, data: { status: nextStatus[action] } }); await tx.reviewModerationAction.create({ data: { reviewId, adminUserId, action, reason: reason || null } }); return tx.review.findUniqueOrThrow({ where: { id: reviewId }, select: { id: true, status: true } }); });
  return updated;
};

export const resolveReviewReport = async (adminUserId: string, reportId: string, status: ReviewReportStatus) => {
  const report = await prisma.reviewReport.findUnique({ where: { id: reportId }, select: { id: true } });
  if (!report) throw new ApiError(404, "Review report not found", "REPORT_NOT_FOUND");
  return prisma.reviewReport.update({ where: { id: reportId }, data: { status, resolvedAt: new Date(), resolvedByUserId: adminUserId }, select: { id: true, status: true, resolvedAt: true } });
};
