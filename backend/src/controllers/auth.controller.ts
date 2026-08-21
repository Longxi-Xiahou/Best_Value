import type { RequestHandler } from "express";
import { authenticateUser, createSessionToken, createUser, getUserById } from "../services/auth.service.js";
import { clearAuthCookie, setAuthCookie } from "../utils/auth-cookie.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { loginSchema, registerSchema } from "../validators/auth.validation.js";

export const register: RequestHandler = asyncHandler(async (request, response) => {
  const input = registerSchema.parse(request.body);
  const user = await createUser(input);
  setAuthCookie(response, createSessionToken(user));
  response.status(201).json({ success: true, data: { user } });
});

export const login: RequestHandler = asyncHandler(async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await authenticateUser(input.email, input.password);
  setAuthCookie(response, createSessionToken(user));
  response.status(200).json({ success: true, data: { user } });
});

export const logout: RequestHandler = (_request, response) => {
  clearAuthCookie(response);
  response.status(200).json({ success: true, data: { message: "Logged out successfully" } });
};

export const me: RequestHandler = asyncHandler(async (request, response) => {
  const userId = request.auth?.userId;
  if (!userId) throw new ApiError(401, "Authentication is required", "UNAUTHENTICATED");

  const user = await getUserById(userId);
  if (!user) throw new ApiError(401, "Authentication is required", "UNAUTHENTICATED");

  response.status(200).json({ success: true, data: { user } });
});
