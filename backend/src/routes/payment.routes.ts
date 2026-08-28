import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { checkoutSession } from "../controllers/payment.controller.js";

export const paymentRouter = Router();
paymentRouter.post("/create-checkout-session", requireAuth, checkoutSession);
