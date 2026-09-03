import type { AuthTokenPayload } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
      seller?: { id: string; status: "PENDING" | "ACTIVE" | "SUSPENDED" };
      requestId: string;
    }
  }
}

export {};
