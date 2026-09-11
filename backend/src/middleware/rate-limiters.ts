import rateLimit from "express-rate-limit";

const limiter = (max: number, message: string) => rateLimit({ windowMs: 15 * 60 * 1000, max, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, error: { message, code: "RATE_LIMITED" } } });

export const cartMutationLimiter = limiter(120, "Too many cart changes. Please try again later.");
export const orderCreationLimiter = limiter(20, "Too many order attempts. Please try again later.");
export const paymentLimiter = limiter(10, "Too many payment attempts. Please try again later.");
export const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, error: { message: "Too many search suggestions. Please try again later.", code: "RATE_LIMITED" } } });
export const webhookLimiter = limiter(120, "Too many webhook requests. Please try again later.");
export const adminMutationLimiter = limiter(60, "Too many administrative mutations. Please try again later.");
export const sellerImportLimiter = limiter(10, "Too many product import attempts. Please try again later.");
