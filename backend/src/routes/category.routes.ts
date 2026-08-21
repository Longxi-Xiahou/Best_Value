import { Router } from "express";
import { getCategories, getCategory, getCategoryProducts } from "../controllers/category.controller.js";

export const categoryRouter = Router();
categoryRouter.get("/", getCategories);
categoryRouter.get("/:slug/products", getCategoryProducts);
categoryRouter.get("/:slug", getCategory);
