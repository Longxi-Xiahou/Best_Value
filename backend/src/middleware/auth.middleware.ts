import type { RequestHandler } from "express";
import { getSessionPayload } from "../services/auth.service.js";
import { AUTH_COOKIE_NAME } from "../utils/auth-cookie.js";
import { ApiError } from "../utils/api-error.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME];
  const payload = typeof token === "string" ? getSessionPayload(token) : null;

  if (!payload) return next(new ApiError(401, "Authentication is required", "UNAUTHENTICATED"));

  request.auth = payload;
  return next();
};

export const optionalAuth: RequestHandler = (request, _response, next) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME];
  const payload = typeof token === "string" ? getSessionPayload(token) : null;
  if (payload) request.auth = payload;
  next();
};
