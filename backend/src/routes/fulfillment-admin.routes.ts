import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { list, update } from "../controllers/fulfillment-admin.controller.js";
import { adminMutationLimiter } from "../middleware/rate-limiters.js";

export const fulfillmentAdminRouter = Router();
fulfillmentAdminRouter.use(requireAuth, requireAdmin);
fulfillmentAdminRouter.get("/fulfillments", list);
fulfillmentAdminRouter.patch("/fulfillments/:id/status", adminMutationLimiter, update);
