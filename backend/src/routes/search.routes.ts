import { Router } from "express";
import { getSuggestions } from "../controllers/search.controller.js";
import { searchLimiter } from "../middleware/rate-limiters.js";

export const searchRouter = Router();
searchRouter.get("/suggestions", searchLimiter, getSuggestions);
