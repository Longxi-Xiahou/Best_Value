import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { products, updateStatus } from "../controllers/admin.controller.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/products", products);
adminRouter.patch("/products/:id/status", updateStatus);
