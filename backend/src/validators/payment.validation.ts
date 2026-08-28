import { z } from "zod";

export const paymentOrderSchema = z.object({ orderId: z.string().cuid("Invalid order ID") });
export const refundSchema = z.object({ amount: z.coerce.number().finite().positive().optional(), reason: z.string().trim().max(255).optional() });
export const paymentOrderParamsSchema = z.object({ id: z.string().cuid("Invalid order ID") });
