import { z } from "zod";

const optionalPrice = z.preprocess(
  (value) => value === "" || value === undefined ? undefined : value,
  z.coerce.number().finite().nonnegative().optional(),
);

const optionalText = (maxLength: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).max(maxLength).optional(),
);

const categorySlug = z.string().trim().min(1).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid category slug");

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  search: optionalText(100),
  q: optionalText(100),
  category: categorySlug.optional(),
  categoryId: z.string().cuid("Invalid category ID").optional(),
  seller: z.string().trim().min(1).max(191).optional(),
  brand: optionalText(191),
  attributes: optionalText(1000),
  minPrice: optionalPrice,
  maxPrice: optionalPrice,
  sort: z.enum(["relevance", "price", "newest", "oldest", "popular", "price_asc", "price_desc"]).default("relevance"),
  order: z.enum(["asc", "desc"]).optional(),
}).superRefine((value, context) => {
  if (value.pageSize !== undefined) value.limit = value.pageSize;
  if (value.q && value.search) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Use either q or search, not both", path: ["q"] });
  }
  if (value.category && value.categoryId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Use either category or categoryId, not both", path: ["category"] });
  }
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "minPrice cannot exceed maxPrice", path: ["minPrice"] });
  }
});

export const productParamsSchema = z.object({ id: z.string().cuid("Invalid product ID") });
export const categoryParamsSchema = z.object({ slug: categorySlug });

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
