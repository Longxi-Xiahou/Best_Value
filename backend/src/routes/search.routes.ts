import { Router } from "express";
import { getSuggestions } from "../controllers/search.controller.js";

export const searchRouter = Router();
searchRouter.get("/suggestions", getSuggestions);
