import { Router } from "express";
import { methods } from "../controllers/shipping.controller.js";

export const shippingRouter = Router();
shippingRouter.get("/methods", methods);
