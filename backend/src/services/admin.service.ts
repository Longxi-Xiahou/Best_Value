import { ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

export const listModerationProducts = () => prisma.product.findMany({ select: { id: true, title: true, slug: true, status: true, basePrice: true, createdAt: true, seller: { select: { id: true, storeName: true, status: true } }, category: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } }).then((items) => items.map((item) => ({ ...item, basePrice: Number(item.basePrice) })));
export const moderateProduct = async (productId: string, status: ProductStatus) => {
  const product = await prisma.product.updateMany({ where: { id: productId }, data: { status } });
  if (product.count !== 1) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  return prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { id: true, title: true, status: true } });
};
