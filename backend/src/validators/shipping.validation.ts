import { z } from "zod";

export const shippingMethodSchema = z.enum(["STANDARD", "EXPRESS"]);
export const fulfillmentParamsSchema = z.object({ id: z.string().cuid("Invalid fulfillment ID") });
export const fulfillmentUpdateSchema = z.object({ status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(), trackingNumber: z.string().trim().max(191).optional().or(z.literal("")), carrier: z.string().trim().max(100).optional().or(z.literal("")) });
