import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_URLS: z.string().optional().transform((value) => value ? value.split(",").map((origin) => origin.trim()).filter(Boolean) : []),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  PLATFORM_FEE_PERCENT: z.coerce.number().finite().min(0).max(100).default(10),
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && new URL(value.FRONTEND_URL).hostname === "localhost") context.addIssue({ code: z.ZodIssueCode.custom, path: ["FRONTEND_URL"], message: "Production FRONTEND_URL must not be localhost" });
  if ((value.STRIPE_SECRET_KEY && !value.STRIPE_WEBHOOK_SECRET) || (!value.STRIPE_SECRET_KEY && value.STRIPE_WEBHOOK_SECRET)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["STRIPE_WEBHOOK_SECRET"], message: "Stripe secret and webhook secret must be configured together" });
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
