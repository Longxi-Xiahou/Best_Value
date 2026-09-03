import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { checkoutSession } from "../controllers/payment.controller.js";
import { paymentLimiter } from "../middleware/rate-limiters.js";

export const paymentRouter = Router();
paymentRouter.post("/create-checkout-session", paymentLimiter, requireAuth, checkoutSession);
