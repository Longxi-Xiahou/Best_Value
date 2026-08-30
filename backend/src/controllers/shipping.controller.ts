import type { RequestHandler } from "express";
import { listShippingMethods } from "../services/shipping.service.js";

export const methods: RequestHandler = (_request, response) => { response.json({ success: true, data: { items: listShippingMethods() } }); };
