import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireSeller } from "../middleware/role.middleware.js";
import { dashboard, inventory, me, onboard, orderDetail, orders, productCreate, productDetail, productUpdate, products, publicProfile } from "../controllers/seller.controller.js";

export const sellerRouter = Router();
sellerRouter.post("/me", requireAuth, onboard);
sellerRouter.get("/me", requireAuth, me);
sellerRouter.get("/:id", publicProfile);

export const protectedSellerRouter = Router();
protectedSellerRouter.use(requireAuth, requireSeller);
protectedSellerRouter.get("/dashboard", dashboard);
protectedSellerRouter.get("/products", products);
protectedSellerRouter.post("/products", productCreate);
protectedSellerRouter.get("/products/:id", productDetail);
protectedSellerRouter.patch("/products/:id", productUpdate);
protectedSellerRouter.patch("/products/:id/inventory", inventory);
protectedSellerRouter.get("/orders", orders);
protectedSellerRouter.get("/orders/:id", orderDetail);
