import { ProductInteractionType } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const recordProductInteraction = async (userId: string | undefined, productId: string, type: ProductInteractionType) => {
  if (!userId) return;
  const recent = await prisma.productInteraction.findFirst({ where: { userId, productId, type, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } }, select: { id: true } });
  if (!recent) await prisma.productInteraction.create({ data: { userId, productId, type } });
};
