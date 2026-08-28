import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { remove, update } from "../controllers/review.controller.js";

export const reviewRouter = Router();
reviewRouter.patch("/reviews/:id", requireAuth, update);
reviewRouter.delete("/reviews/:id", requireAuth, remove);
