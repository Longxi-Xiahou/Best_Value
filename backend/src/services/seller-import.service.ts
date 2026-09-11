import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

export const IMPORT_MAX_BYTES = 512 * 1024;
export const IMPORT_MAX_ROWS = 250;
const IMPORT_MAX_ERRORS = 500;
const HEADERS = ["title", "description", "brand", "category", "price", "currency", "stock", "sku", "imageUrls"] as const;

export type ImportRow = {
  title: string;
  description: string;
  brand?: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  sku: string;
  imageUrls: string[];
  categoryId: string;
};
type ValidImportRow = ImportRow & { row: number };

export type ImportIssue = { row: number; field?: string; message: string };

export type ImportPreview = {
  valid: boolean;
  rowCount: number;
  errors: ImportIssue[];
  rows: Array<Omit<ImportRow, "categoryId"> & { row: number }>;
};

const formulaPrefix = /^[=+\-@]/;

const parseCsv = (input: string): string[][] => {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;

  const pushField = () => { row.push(field); field = ""; quoteClosed = false; };
  const pushRow = () => {
    pushField();
    if (row.some((value) => value.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') { field += '"'; index += 1; }
        else { quoted = false; quoteClosed = true; }
      } else field += character;
      continue;
    }
    if (quoteClosed) {
      if (character === ",") pushField();
      else if (character === "\n") pushRow();
      else if (character === "\r") { if (text[index + 1] === "\n") index += 1; pushRow(); }
      else if (character.trim() !== "") throw new Error("Unexpected characters after a quoted field");
      continue;
    }
    if (character === '"') {
      if (field.length > 0) throw new Error("Quoted fields must start at the beginning of a cell");
      quoted = true;
    } else if (character === ",") pushField();
    else if (character === "\n") pushRow();
    else if (character === "\r") { if (text[index + 1] === "\n") index += 1; pushRow(); }
    else field += character;
  }
  if (quoted) throw new Error("Unclosed quoted field");
  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
};

const issue = (errors: ImportIssue[], row: number, field: string | undefined, message: string) => {
  if (errors.length < IMPORT_MAX_ERRORS) errors.push({ row, ...(field ? { field } : {}), message });
};

const parseNumber = (value: string, row: number, field: string, errors: ImportIssue[], integer = false) => {
  if (!value.trim() || formulaPrefix.test(value.trim())) { issue(errors, row, field, "A numeric value is required"); return null; }
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) { issue(errors, row, field, integer ? "Must be a whole number" : "Must be a finite number"); return null; }
  return parsed;
};

const parseUrl = (value: string, row: number, errors: ImportIssue[]) => {
  if (!value.trim()) return null;
  if (formulaPrefix.test(value.trim())) { issue(errors, row, "imageUrls", "Formula-like values are not allowed"); return null; }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    if (value.trim().length > 2048) throw new Error();
    return url.toString();
  } catch { issue(errors, row, "imageUrls", "Each image URL must use http or https and be at most 2048 characters"); return null; }
};

const validateRows = async (input: string): Promise<{ preview: ImportPreview; rows: ValidImportRow[] }> => {
  const errors: ImportIssue[] = [];
  if (Buffer.byteLength(input, "utf8") > IMPORT_MAX_BYTES) issue(errors, 0, undefined, `CSV exceeds the ${IMPORT_MAX_BYTES} byte limit`);
  let parsed: string[][] = [];
  try { parsed = parseCsv(input); } catch (error) { issue(errors, 0, undefined, error instanceof Error ? error.message : "Invalid CSV"); }
  if (!parsed.length) issue(errors, 0, undefined, "CSV must include a header and at least one data row");
  const header = parsed[0]?.map((value) => value.trim()) ?? [];
  const expected = [...HEADERS];
  if (header.length !== expected.length || header.some((value, index) => value !== expected[index])) issue(errors, 1, undefined, `Header must be exactly: ${expected.join(",")}`);
  const dataRows = parsed.slice(1);
  if (dataRows.length > IMPORT_MAX_ROWS) issue(errors, 0, undefined, `CSV may contain at most ${IMPORT_MAX_ROWS} data rows`);

  const rows: ValidImportRow[] = [];
  const categorySlugs = [...new Set(dataRows.map((values) => (values[3] ?? "").trim()).filter(Boolean))];
  const categories = categorySlugs.length ? await prisma.category.findMany({ where: { slug: { in: categorySlugs } }, select: { id: true, slug: true } }) : [];
  const categoryMap = new Map(categories.map((category) => [category.slug, category.id]));
  const skus = new Set<string>();
  const skuRows = new Map<string, number>();
  for (const [offset, values] of dataRows.entries()) {
    const rowNumber = offset + 2;
    if (values.length !== HEADERS.length) { issue(errors, rowNumber, undefined, "Row has the wrong number of columns"); continue; }
    if (values.some((value) => formulaPrefix.test(value.trim()))) issue(errors, rowNumber, undefined, "Formula-like values (=, +, -, @) are not allowed");
    const [titleRaw, descriptionRaw, brandRaw, categoryRaw, priceRaw, currencyRaw, stockRaw, skuRaw, imageRaw] = values;
    const title = titleRaw.trim(); const description = descriptionRaw.trim(); const brand = brandRaw.trim(); const category = categoryRaw.trim(); const sku = skuRaw.trim(); const currency = currencyRaw.trim().toUpperCase();
    if (!title || title.length < 2 || title.length > 255) issue(errors, rowNumber, "title", "Title must be 2-255 characters");
    if (!description || description.length > 20000) issue(errors, rowNumber, "description", "Description is required and must be at most 20000 characters");
    if (brand.length > 191) issue(errors, rowNumber, "brand", "Brand must be at most 191 characters");
    if (!categoryMap.has(category)) issue(errors, rowNumber, "category", "Category slug was not found");
    const price = parseNumber(priceRaw, rowNumber, "price", errors);
    if (price !== null && (price < 0 || price > 9999999999.99)) issue(errors, rowNumber, "price", "Price must be between 0 and 9999999999.99");
    if (!/^[A-Z]{3}$/.test(currency)) issue(errors, rowNumber, "currency", "Currency must be a 3-letter code");
    const stock = parseNumber(stockRaw, rowNumber, "stock", errors, true);
    if (stock !== null && (stock < 0 || stock > 1000000)) issue(errors, rowNumber, "stock", "Stock must be an integer from 0 to 1000000");
    if (!sku || sku.length > 191) issue(errors, rowNumber, "sku", "SKU is required and must be at most 191 characters");
    if (sku && skus.has(sku)) issue(errors, rowNumber, "sku", "SKU is duplicated in this file");
    if (sku && !skuRows.has(sku)) skuRows.set(sku, rowNumber);
    skus.add(sku);
    const imageUrls = imageRaw.split(";").map((value) => parseUrl(value, rowNumber, errors)).filter((value): value is string => Boolean(value));
    if (imageUrls.length > 30) issue(errors, rowNumber, "imageUrls", "At most 30 image URLs are allowed");
    if (price !== null && stock !== null && title.length >= 2 && title.length <= 255 && description && description.length <= 20000 && categoryMap.has(category) && /^[A-Z]{3}$/.test(currency) && sku && sku.length <= 191 && imageUrls.length <= 30) rows.push({ row: rowNumber, title, description, brand: brand || undefined, category, price, currency, stock, sku, imageUrls, categoryId: categoryMap.get(category)! });
  }
  if (skus.size) {
    const existing = await prisma.productVariant.findMany({ where: { sku: { in: [...skus] } }, select: { sku: true } });
    for (const variant of existing) issue(errors, skuRows.get(variant.sku) ?? 0, "sku", `SKU already exists: ${variant.sku}`);
  }
  const previewRows = rows.map(({ categoryId: _categoryId, ...row }) => row);
  return { preview: { valid: errors.length === 0 && rows.length === dataRows.length, rowCount: dataRows.length, errors, rows: previewRows }, rows };
};

export const previewSellerProductImport = async (csv: unknown): Promise<ImportPreview> => {
  if (typeof csv !== "string") throw new ApiError(400, "CSV must be provided as a UTF-8 string", "CSV_REQUIRED");
  return (await validateRows(csv)).preview;
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 170) || "product";

export const importSellerProducts = async (sellerId: string, csv: unknown) => {
  if (typeof csv !== "string") throw new ApiError(400, "CSV must be provided as a UTF-8 string", "CSV_REQUIRED");
  const { preview, rows } = await validateRows(csv);
  if (!preview.valid) throw new ApiError(400, "CSV validation failed; no products were imported", "CSV_INVALID");
  try {
    const products = await prisma.$transaction(async (tx) => {
      const created: Array<{ id: string; title: string; sku: string; status: ProductStatus }> = [];
      for (const row of rows) {
        const product: { id: string; title: string; status: ProductStatus } = await tx.product.create({ data: { sellerId, categoryId: row.categoryId, title: row.title, slug: `${slugify(row.title)}-${Date.now().toString(36)}-${created.length}`, description: row.description, brand: row.brand ?? null, basePrice: row.price, currency: row.currency, stockQuantity: 0, status: ProductStatus.DRAFT } });
        if (row.imageUrls.length) await tx.productImage.createMany({ data: row.imageUrls.map((url, position) => ({ productId: product.id, url, altText: row.title, position })) });
        await tx.productVariant.create({ data: { productId: product.id, sku: row.sku, price: row.price, stockQuantity: row.stock } });
        created.push({ id: product.id, title: product.title, sku: row.sku, status: product.status });
      }
      return created;
    });
    return { importedCount: products.length, products };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "One or more SKUs already exist; no products were imported", "SKU_CONFLICT");
    throw error;
  }
};
