import { Router } from "express";
import { getProduct, getProducts } from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { create, list } from "../controllers/review.controller.js";

export const productRouter = Router();
productRouter.get("/", getProducts);
productRouter.get("/:id/reviews", list);
productRouter.post("/:id/reviews", requireAuth, create);
productRouter.get("/:id", getProduct);
