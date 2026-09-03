import { Router } from "express";
import { addItem, deleteCart, getCurrentCart, removeItem, updateItem } from "../controllers/cart.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { cartMutationLimiter } from "../middleware/rate-limiters.js";

export const cartRouter = Router();
cartRouter.use(requireAuth);
cartRouter.get("/", getCurrentCart);
cartRouter.post("/items", cartMutationLimiter, addItem);
cartRouter.patch("/items/:id", cartMutationLimiter, updateItem);
cartRouter.delete("/items/:id", cartMutationLimiter, removeItem);
cartRouter.delete("/", cartMutationLimiter, deleteCart);
