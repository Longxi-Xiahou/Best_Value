import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getProduct, getProducts, getRelated, getTrending } from "../controllers/product.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";
import { create, list } from "../controllers/review.controller.js";

export const productRouter = Router();
const reviewWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, error: { message: "Too many review submissions. Please try again later.", code: "RATE_LIMITED" } } });
productRouter.get("/", optionalAuth, getProducts);
productRouter.get("/trending", getTrending);
productRouter.get("/:id/reviews", list);
productRouter.post("/:id/reviews", reviewWriteLimiter, requireAuth, create);
productRouter.get("/:id/related", getRelated);
productRouter.get("/:id", optionalAuth, getProduct);
