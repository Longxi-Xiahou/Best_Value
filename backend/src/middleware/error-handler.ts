import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, error: { message: `Route ${req.method} ${req.path} was not found`, code: "NOT_FOUND" } });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const statusCode = error instanceof ZodError ? 400 : error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ZodError ? "Invalid request data" : error instanceof ApiError ? error.message : "An unexpected server error occurred";
  const code = error instanceof ZodError ? "VALIDATION_ERROR" : error instanceof ApiError ? error.code : "INTERNAL_ERROR";

  console.error(JSON.stringify({ level: statusCode >= 500 ? "error" : "warn", event: "request_error", requestId: req.requestId, method: req.method, path: req.path, status: statusCode, code, message: statusCode >= 500 ? "Unexpected server error" : "Request rejected" }));
  res.setHeader("X-Request-Id", req.requestId);
  res.status(statusCode).json({ success: false, error: { message, code } });
};
