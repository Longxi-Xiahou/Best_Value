import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { allocations, payments, refund } from "../controllers/payment-admin.controller.js";

export const paymentAdminRouter = Router();
paymentAdminRouter.use(requireAuth, requireAdmin);
paymentAdminRouter.get("/payments", payments);
paymentAdminRouter.get("/allocations", allocations);
paymentAdminRouter.post("/orders/:id/refund", refund);
