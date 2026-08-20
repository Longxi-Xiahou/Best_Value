import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, error: { message: `Route ${req.method} ${req.path} was not found`, code: "NOT_FOUND" } });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : "An unexpected server error occurred";
  const code = error instanceof ApiError ? error.code : "INTERNAL_ERROR";

  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, error: { message, code } });
};
