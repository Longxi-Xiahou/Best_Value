import { Prisma, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import type { AuthTokenPayload, SafeUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";

const PASSWORD_SALT_ROUNDS = 12;
const TOKEN_ISSUER = "best-value-api";
const TOKEN_AUDIENCE = "best-value-web";

export const safeUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type UserWithSafeFields = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;

const toSafeUser = (user: UserWithSafeFields): SafeUser => user;

interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export const createUser = async ({ email, password, firstName, lastName }: RegisterUserInput): Promise<SafeUser> => {
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) throw new ApiError(409, "An account with that email already exists", "EMAIL_ALREADY_REGISTERED");

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName: lastName ?? null },
      select: safeUserSelect,
    });
    return toSafeUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "An account with that email already exists", "EMAIL_ALREADY_REGISTERED");
    }
    throw error;
  }
};

export const authenticateUser = async (email: string, password: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  return toSafeUser({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  });
};

export const getUserById = async (userId: string): Promise<SafeUser | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  return user ? toSafeUser(user) : null;
};

export const createSessionToken = (user: Pick<User, "id">): string => jwt.sign(
  {},
  env.JWT_SECRET,
  {
    subject: user.id,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  },
);

export const getSessionPayload = (token: string): AuthTokenPayload | null => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE });
    if (typeof payload === "string" || typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
};
