import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireSeller } from "../middleware/role.middleware.js";
import { detail, list, update } from "../controllers/fulfillment.controller.js";

export const fulfillmentRouter = Router();
fulfillmentRouter.use(requireAuth, requireSeller);
fulfillmentRouter.get("/fulfillments", list);
fulfillmentRouter.get("/fulfillments/:id", detail);
fulfillmentRouter.patch("/fulfillments/:id/status", update);
