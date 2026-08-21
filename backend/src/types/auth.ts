import type { UserRole } from "@prisma/client";

export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
}
