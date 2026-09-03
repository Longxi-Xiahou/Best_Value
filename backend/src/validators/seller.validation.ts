import { z } from "zod";

const id = z.string().cuid("Invalid ID");
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const attributeSchema = z.object({ code: z.string().trim().min(1).max(191).regex(/^[a-z0-9-]+$/), name: z.string().trim().min(1).max(191).optional(), value: z.string().trim().min(1).max(500) });
const variantSchema = z.object({ id: id.optional(), sku: z.string().trim().min(1).max(191), price: z.coerce.number().finite().nonnegative().optional(), stockQuantity: z.coerce.number().int().min(0).max(1000000), attributes: z.array(attributeSchema).max(30).default([]) });
const imageSchema = z.object({ url: z.string().url().max(2048).refine((value) => { const protocol = new URL(value).protocol; return protocol === "http:" || protocol === "https:"; }, "Image URL must use HTTP or HTTPS"), altText: optionalText(255), position: z.coerce.number().int().min(0).max(1000).default(0) });

export const sellerOnboardingSchema = z.object({ storeName: z.string().trim().min(2).max(191), description: optionalText(5000) });
export const sellerProductCreateSchema = z.object({ title: z.string().trim().min(2).max(255), description: z.string().trim().min(1).max(20000), categoryId: id, brand: optionalText(191), basePrice: z.coerce.number().finite().nonnegative(), stockQuantity: z.coerce.number().int().min(0).max(1000000), currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("USD"), images: z.array(imageSchema).max(30).default([]), attributes: z.array(attributeSchema).max(50).default([]), variants: z.array(variantSchema).max(100).default([]) });
export const sellerProductUpdateSchema = sellerProductCreateSchema.partial().extend({ status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional() });
export const inventoryUpdateSchema = z.object({ stockQuantity: z.coerce.number().int().min(0).max(1000000), variantId: id.optional() });
export const sellerProductParamsSchema = z.object({ id });
export const sellerParamsSchema = z.object({ id: z.string().trim().min(1).max(191) });
export const sellerOrderParamsSchema = z.object({ id });
export const reviewCreateSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), title: optionalText(255), body: z.string().trim().min(1).max(10000) });
export const reviewUpdateSchema = reviewCreateSchema.partial();
export const reviewParamsSchema = z.object({ id });
export type SellerProductCreateInput = z.infer<typeof sellerProductCreateSchema>;
