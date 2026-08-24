import { z } from "zod";

const id = z.string().cuid("Invalid ID");
const quantity = z.coerce.number().int().min(1).max(999);

export const cartItemInputSchema = z.object({
  productId: id,
  variantId: id.optional(),
  quantity,
});

export const cartItemParamsSchema = z.object({ id });

export const updateCartItemSchema = z.object({ quantity });

export const orderParamsSchema = z.object({ id });

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1).max(191),
  addressLine1: z.string().trim().min(1).max(191),
  addressLine2: z.string().trim().max(191).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().min(1).max(30),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
});

export const createOrderSchema = z.object({ shippingAddress: shippingAddressSchema });

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
