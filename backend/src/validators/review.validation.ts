import { z } from "zod";

const id = z.string().cuid("Invalid ID");
const reviewBody = z.string().trim().min(10, "Review must be at least 10 characters").max(5000);
const title = z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(255).optional());

export const reviewCreateSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), title, body: reviewBody });
export const reviewUpdateSchema = reviewCreateSchema.partial();
export const reviewParamsSchema = z.object({ id });
export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
  verified: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});
export const reportCreateSchema = z.object({
  reason: z.enum(["SPAM", "HARASSMENT", "OFF_TOPIC", "FAKE_REVIEW", "INAPPROPRIATE", "OTHER"]),
  details: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(1000).optional()),
});
export const adminReviewListQuerySchema = z.object({
  status: z.enum(["PUBLISHED", "HIDDEN", "REMOVED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export const moderateReviewSchema = z.object({ action: z.enum(["HIDE", "RESTORE", "REMOVE"]), reason: z.string().trim().max(1000).optional() });
export const reviewReportListQuerySchema = z.object({
  status: z.enum(["OPEN", "REVIEWED", "DISMISSED", "ACTIONED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export const resolveReportSchema = z.object({ status: z.enum(["REVIEWED", "DISMISSED", "ACTIONED"]) });

