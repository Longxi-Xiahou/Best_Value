import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.middleware.js";
import { remove, report, update } from "../controllers/review.controller.js";

export const reviewRouter = Router();
const reportLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: "draft-8", legacyHeaders: false });
reviewRouter.patch("/reviews/:id", requireAuth, update);
reviewRouter.delete("/reviews/:id", requireAuth, remove);
reviewRouter.post("/reviews/:id/reports", reportLimiter, requireAuth, report);
