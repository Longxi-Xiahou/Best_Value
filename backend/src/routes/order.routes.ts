import { Router } from "express";
import { create, detail, list } from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const orderRouter = Router();
orderRouter.use(requireAuth);
orderRouter.get("/", list);
orderRouter.post("/", create);
orderRouter.get("/:id", detail);
