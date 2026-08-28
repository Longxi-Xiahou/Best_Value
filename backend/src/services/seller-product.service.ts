import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type { SellerProductCreateInput } from "../validators/seller.validation.js";

const productManageSelect = {
  id: true, title: true, slug: true, description: true, brand: true, basePrice: true, currency: true, stockQuantity: true, status: true, createdAt: true, updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: { select: { id: true, url: true, altText: true, position: true } , orderBy: { position: "asc" } },
  attributes: { select: { id: true, value: true, attribute: { select: { id: true, code: true, name: true } } } },
  variants: { select: { id: true, sku: true, price: true, stockQuantity: true, attributes: { select: { value: true, attribute: { select: { id: true, code: true, name: true } } } } }, orderBy: { sku: "asc" } },
} satisfies Prisma.ProductSelect;

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 170) || "product";
const productSlug = async (title: string) => `${slugify(title)}-${Date.now().toString(36)}`;
const money = (value: number | null | undefined) => value === undefined || value === null ? null : new Prisma.Decimal(value);

const upsertAttribute = async (tx: Prisma.TransactionClient, code: string, name?: string) => tx.attribute.upsert({ where: { code }, update: name ? { name } : {}, create: { code, name: name ?? code } });

const mapProduct = (product: Prisma.ProductGetPayload<{ select: typeof productManageSelect }>) => ({
  ...product, basePrice: Number(product.basePrice), images: product.images, attributes: product.attributes.map(({ attribute, value }) => ({ ...attribute, value })), variants: product.variants.map((variant) => ({ ...variant, price: variant.price === null ? null : Number(variant.price), attributes: variant.attributes.map(({ attribute, value }) => ({ ...attribute, value })) })),
});

const validateCategory = async (categoryId: string) => {
  if (!await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })) throw new ApiError(400, "Category not found", "CATEGORY_NOT_FOUND");
};

export const listSellerProducts = async (sellerId: string) => {
  const products = await prisma.product.findMany({ where: { sellerId }, select: productManageSelect, orderBy: { updatedAt: "desc" } });
  return products.map(mapProduct);
};

export const getSellerProduct = async (sellerId: string, productId: string) => {
  const product = await prisma.product.findFirst({ where: { id: productId, sellerId }, select: productManageSelect });
  if (!product) throw new ApiError(404, "Seller product not found", "SELLER_PRODUCT_NOT_FOUND");
  return mapProduct(product);
};

const writeFlexibleData = async (tx: Prisma.TransactionClient, productId: string, input: Pick<SellerProductCreateInput, "images" | "attributes" | "variants">) => {
  await tx.productImage.deleteMany({ where: { productId } });
  await tx.productAttribute.deleteMany({ where: { productId } });
  await tx.productVariant.deleteMany({ where: { productId } });
  if (input.images.length) await tx.productImage.createMany({ data: input.images.map((image) => ({ productId, url: image.url, altText: image.altText || null, position: image.position })) });
  for (const attributeInput of input.attributes) {
    const attribute = await upsertAttribute(tx, attributeInput.code, attributeInput.name);
    await tx.productAttribute.create({ data: { productId, attributeId: attribute.id, value: attributeInput.value } });
  }
  for (const variantInput of input.variants) {
    const variant = await tx.productVariant.create({ data: { productId, sku: variantInput.sku, price: money(variantInput.price), stockQuantity: variantInput.stockQuantity } });
    for (const attributeInput of variantInput.attributes) {
      const attribute = await upsertAttribute(tx, attributeInput.code, attributeInput.name);
      await tx.productVariantAttribute.create({ data: { variantId: variant.id, attributeId: attribute.id, value: attributeInput.value } });
    }
  }
};

export const createSellerProduct = async (sellerId: string, input: SellerProductCreateInput) => {
  await validateCategory(input.categoryId);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data: { sellerId, categoryId: input.categoryId, title: input.title, slug: await productSlug(input.title), description: input.description, brand: input.brand || null, basePrice: input.basePrice, currency: input.currency, stockQuantity: input.stockQuantity, status: ProductStatus.DRAFT } });
    await writeFlexibleData(tx, created.id, input);
    return tx.product.findUniqueOrThrow({ where: { id: created.id }, select: productManageSelect });
  });
  return mapProduct(product);
};

export const updateSellerProduct = async (sellerId: string, productId: string, input: Partial<SellerProductCreateInput> & { status?: ProductStatus }) => {
  await getSellerProduct(sellerId, productId);
  if (input.categoryId) await validateCategory(input.categoryId);
  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: productId }, data: { ...(input.title !== undefined ? { title: input.title } : {}), ...(input.description !== undefined ? { description: input.description } : {}), ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}), ...(input.brand !== undefined ? { brand: input.brand || null } : {}), ...(input.basePrice !== undefined ? { basePrice: input.basePrice } : {}), ...(input.currency !== undefined ? { currency: input.currency } : {}), ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}), ...(input.status !== undefined ? { status: input.status } : {}) } });
    if (input.images || input.attributes || input.variants) {
      const current = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { images: true, attributes: { select: { value: true, attribute: { select: { code: true, name: true } } } }, variants: { select: { sku: true, price: true, stockQuantity: true, attributes: { select: { value: true, attribute: { select: { code: true, name: true } } } } } } } });
      await writeFlexibleData(tx, productId, { images: input.images ?? current.images.map((image) => ({ url: image.url, altText: image.altText ?? undefined, position: image.position })), attributes: input.attributes ?? current.attributes.map(({ attribute, value }) => ({ code: attribute.code, name: attribute.name, value })), variants: input.variants ?? current.variants.map((variant) => ({ sku: variant.sku, price: variant.price === null ? undefined : Number(variant.price), stockQuantity: variant.stockQuantity, attributes: variant.attributes.map(({ attribute, value }) => ({ code: attribute.code, name: attribute.name, value })) })) });
    }
    return tx.product.findUniqueOrThrow({ where: { id: productId }, select: productManageSelect });
  });
  return mapProduct(product);
};

export const updateSellerInventory = async (sellerId: string, productId: string, stockQuantity: number, variantId?: string) => {
  await getSellerProduct(sellerId, productId);
  if (variantId) {
    const result = await prisma.productVariant.updateMany({ where: { id: variantId, productId }, data: { stockQuantity } });
    if (result.count !== 1) throw new ApiError(404, "Product variant not found", "VARIANT_NOT_FOUND");
  } else await prisma.product.update({ where: { id: productId }, data: { stockQuantity } });
  return getSellerProduct(sellerId, productId);
};
