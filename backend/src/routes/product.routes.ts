import { Router } from "express";
import { getProduct, getProducts, getRelated, getTrending } from "../controllers/product.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";
import { create, list } from "../controllers/review.controller.js";

export const productRouter = Router();
productRouter.get("/", optionalAuth, getProducts);
productRouter.get("/trending", getTrending);
productRouter.get("/:id/reviews", list);
productRouter.post("/:id/reviews", requireAuth, create);
productRouter.get("/:id/related", getRelated);
productRouter.get("/:id", optionalAuth, getProduct);
