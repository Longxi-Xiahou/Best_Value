import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getRecommendations, getRecentlyViewed } from "../controllers/recommendation.controller.js";

export const recommendationRouter = Router();
recommendationRouter.use(requireAuth);
recommendationRouter.get("/", getRecommendations);
recommendationRouter.get("/recent", getRecentlyViewed);
