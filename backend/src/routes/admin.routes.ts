import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { products, updateStatus } from "../controllers/admin.controller.js";
import { listReviews, listReports, moderate, resolveReport } from "../controllers/review-admin.controller.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/products", products);
adminRouter.patch("/products/:id/status", updateStatus);
adminRouter.get("/reviews", listReviews);
adminRouter.patch("/reviews/:id/moderate", moderate);
adminRouter.get("/review-reports", listReports);
adminRouter.patch("/review-reports/:id", resolveReport);
