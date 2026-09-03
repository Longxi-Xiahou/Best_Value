import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestContext: RequestHandler = (request, response, next) => {
  request.requestId = randomUUID();
  response.setHeader("X-Request-Id", request.requestId);
  next();
};

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = Date.now();
  response.on("finish", () => console.info(JSON.stringify({ level: "info", event: "http_request", requestId: request.requestId, method: request.method, path: request.path, status: response.statusCode, durationMs: Date.now() - startedAt })));
  next();
};
