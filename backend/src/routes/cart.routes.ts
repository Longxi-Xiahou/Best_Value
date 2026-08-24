import { Router } from "express";
import { addItem, deleteCart, getCurrentCart, removeItem, updateItem } from "../controllers/cart.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const cartRouter = Router();
cartRouter.use(requireAuth);
cartRouter.get("/", getCurrentCart);
cartRouter.post("/items", addItem);
cartRouter.patch("/items/:id", updateItem);
cartRouter.delete("/items/:id", removeItem);
cartRouter.delete("/", deleteCart);
