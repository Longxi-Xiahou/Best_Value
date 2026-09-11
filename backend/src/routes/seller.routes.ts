import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireSeller } from "../middleware/role.middleware.js";
import { dashboard, inventory, me, onboard, orderDetail, orders, productCreate, productDetail, productImport, productImportPreview, productUpdate, products, publicProfile } from "../controllers/seller.controller.js";
import { transactions } from "../controllers/seller-transaction.controller.js";
import { sellerImportLimiter } from "../middleware/rate-limiters.js";

export const sellerRouter = Router();
sellerRouter.post("/me", requireAuth, onboard);
sellerRouter.get("/me", requireAuth, me);
sellerRouter.get("/:id", publicProfile);

export const protectedSellerRouter = Router();
protectedSellerRouter.use(requireAuth, requireSeller);
protectedSellerRouter.get("/dashboard", dashboard);
protectedSellerRouter.get("/products", products);
protectedSellerRouter.post("/products", productCreate);
protectedSellerRouter.post("/products/import/preview", sellerImportLimiter, productImportPreview);
protectedSellerRouter.post("/products/import", sellerImportLimiter, productImport);
protectedSellerRouter.get("/products/:id", productDetail);
protectedSellerRouter.patch("/products/:id", productUpdate);
protectedSellerRouter.patch("/products/:id/inventory", inventory);
protectedSellerRouter.get("/orders", orders);
protectedSellerRouter.get("/orders/:id", orderDetail);
protectedSellerRouter.get("/transactions", transactions);
