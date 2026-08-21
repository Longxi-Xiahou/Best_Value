import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "best_value_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api",
};

export const setAuthCookie = (response: Response, token: string) => {
  response.cookie(AUTH_COOKIE_NAME, token, { ...baseCookieOptions, maxAge: SESSION_MAX_AGE_MS });
};

export const clearAuthCookie = (response: Response) => {
  response.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions);
};
