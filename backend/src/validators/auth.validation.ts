import { z } from "zod";

const normalizedEmail = z.string().trim().email("Enter a valid email address").max(191).transform((value) => value.toLowerCase());
const password = z.string().min(12, "Password must be at least 12 characters").max(72, "Password must be at most 72 characters").refine(
  (value) => Buffer.byteLength(value, "utf8") <= 72,
  "Password must be at most 72 bytes",
);

export const registerSchema = z.object({
  email: normalizedEmail,
  password,
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional(),
});

export const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1, "Password is required").max(72),
});
