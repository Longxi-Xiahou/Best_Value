import { PrismaClient, ProductStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type VariantSeed = { sku: string; price?: number; stockQuantity: number; attributes: Array<[string, string]> };
type ProductSeed = {
  slug: string; title: string; description: string; brand: string; category: string; price: number; stockQuantity: number;
  attributes: Array<[string, string]>; variants?: VariantSeed[];
};

const categorySeeds = [
  { slug: "electronics", name: "Electronics" },
  { slug: "computers", name: "Computers", parent: "electronics" },
  { slug: "audio", name: "Audio", parent: "electronics" },
  { slug: "accessories", name: "Accessories", parent: "electronics" },
  { slug: "home-garden", name: "Home & Garden" },
  { slug: "furniture", name: "Furniture", parent: "home-garden" },
  { slug: "kitchen", name: "Kitchen", parent: "home-garden" },
  { slug: "fashion", name: "Fashion" },
  { slug: "apparel", name: "Apparel", parent: "fashion" },
  { slug: "sports-outdoors", name: "Sports & Outdoors" },
  { slug: "camping", name: "Camping", parent: "sports-outdoors" },
  { slug: "books", name: "Books" },
  { slug: "fiction", name: "Fiction", parent: "books" },
  { slug: "beauty", name: "Beauty" },
];

const attributeSeeds = [
  ["color", "Color"], ["material", "Material"], ["size", "Size"], ["storage", "Storage"],
  ["memory", "Memory"], ["connectivity", "Connectivity"], ["capacity", "Capacity"], ["format", "Format"],
] as const;

const products: ProductSeed[] = [
  { slug: "orbit-14-laptop", title: "Orbit 14 Everyday Laptop", description: "A lightweight fictional laptop for work, study, and everyday browsing.", brand: "Northstar", category: "computers", price: 799, stockQuantity: 18, attributes: [["memory", "16GB"], ["storage", "512GB"], ["color", "Silver"]] },
  { slug: "atlas-27-monitor", title: "Atlas 27-inch QHD Monitor", description: "A crisp fictional QHD display with an adjustable stand for productive desks.", brand: "Northstar", category: "computers", price: 289, stockQuantity: 14, attributes: [["size", "27 inch"], ["connectivity", "USB-C"], ["color", "Graphite"]] },
  { slug: "pocket-mechanical-keyboard", title: "Pocket Mechanical Keyboard", description: "Compact wireless keyboard with tactile keys and a rechargeable battery.", brand: "Keyloom", category: "accessories", price: 89, stockQuantity: 42, attributes: [["connectivity", "Bluetooth"], ["color", "Navy"], ["material", "Aluminum"]] },
  { slug: "glide-wireless-mouse", title: "Glide Wireless Mouse", description: "Ergonomic wireless mouse for comfortable all-day navigation.", brand: "Keyloom", category: "accessories", price: 39, stockQuantity: 57, attributes: [["connectivity", "2.4GHz wireless"], ["color", "Black"], ["material", "Recycled plastic"]] },
  { slug: "halo-desk-lamp", title: "Halo Adjustable Desk Lamp", description: "Dimmable LED desk lamp with a focused reading mode and warm ambient light.", brand: "Lumina", category: "accessories", price: 54, stockQuantity: 27, attributes: [["color", "White"], ["material", "Metal"], ["connectivity", "USB-C"]] },
  { slug: "sonic-over-ear-headphones", title: "Sonic Over-Ear Headphones", description: "Comfortable fictional headphones with balanced sound for music and calls.", brand: "Waveform", category: "audio", price: 149, stockQuantity: 22, attributes: [["connectivity", "Bluetooth"], ["color", "Sand"], ["material", "Soft-touch polymer"]] },
  { slug: "signal-mini-speaker", title: "Signal Mini Speaker", description: "Portable Bluetooth speaker with splash resistance for a desk or patio.", brand: "Waveform", category: "audio", price: 59, stockQuantity: 35, attributes: [["connectivity", "Bluetooth"], ["color", "Coral"], ["material", "Fabric mesh"]] },
  { slug: "focus-webcam", title: "Focus 1080p Webcam", description: "Simple full-HD webcam for clear calls, meetings, and online classes.", brand: "Northstar", category: "accessories", price: 69, stockQuantity: 31, attributes: [["format", "1080p"], ["connectivity", "USB"], ["color", "Black"]] },
  { slug: "harbor-reading-chair", title: "Harbor Reading Chair", description: "A supportive upholstered chair designed for quiet reading corners.", brand: "Harbor House", category: "furniture", price: 329, stockQuantity: 8, attributes: [["material", "Woven fabric"], ["color", "Moss"], ["size", "Standard"]] },
  { slug: "ridge-side-table", title: "Ridge Side Table", description: "Compact oak-look side table with a lower shelf for books and essentials.", brand: "Harbor House", category: "furniture", price: 119, stockQuantity: 16, attributes: [["material", "Engineered wood"], ["color", "Natural oak"], ["size", "45 cm"]] },
  { slug: "field-ceramic-mug-set", title: "Field Ceramic Mug Set", description: "Set of four durable ceramic mugs for morning coffee and afternoon tea.", brand: "Fieldstone", category: "kitchen", price: 36, stockQuantity: 45, attributes: [["material", "Ceramic"], ["color", "Cream"], ["capacity", "350 ml"]] },
  { slug: "grove-prep-board", title: "Grove Prep Board", description: "A sturdy bamboo preparation board with a gentle edge for easy handling.", brand: "Fieldstone", category: "kitchen", price: 28, stockQuantity: 40, attributes: [["material", "Bamboo"], ["color", "Natural"], ["size", "38 cm"]] },
  { slug: "ember-pour-over-set", title: "Ember Pour-Over Set", description: "A fictional glass pour-over coffee set for a slow, precise morning ritual.", brand: "Fieldstone", category: "kitchen", price: 64, stockQuantity: 19, attributes: [["material", "Borosilicate glass"], ["capacity", "600 ml"], ["color", "Clear"]] },
  { slug: "canvas-daypack", title: "Canvas Daypack", description: "Versatile daypack with a padded sleeve and compact front organization.", brand: "Trailmark", category: "accessories", price: 74, stockQuantity: 0, attributes: [["material", "Recycled canvas"], ["capacity", "18 L"]], variants: [
    { sku: "TMRK-DAY-OLIVE", price: 74, stockQuantity: 12, attributes: [["color", "Olive"]] },
    { sku: "TMRK-DAY-NAVY", price: 74, stockQuantity: 9, attributes: [["color", "Navy"]] },
  ] },
  { slug: "everyday-cotton-tee", title: "Everyday Cotton Tee", description: "Soft cotton crew-neck tee made for easy layering and everyday wear.", brand: "Common Thread", category: "apparel", price: 24, stockQuantity: 0, attributes: [["material", "Cotton"]], variants: [
    { sku: "CT-TEE-BLK-S", price: 24, stockQuantity: 15, attributes: [["color", "Black"], ["size", "Small"]] },
    { sku: "CT-TEE-BLK-M", price: 24, stockQuantity: 18, attributes: [["color", "Black"], ["size", "Medium"]] },
    { sku: "CT-TEE-CRM-M", price: 26, stockQuantity: 11, attributes: [["color", "Cream"], ["size", "Medium"]] },
  ] },
  { slug: "meridian-knit-beanie", title: "Meridian Knit Beanie", description: "Warm ribbed knit beanie with a soft cuff for cool-weather walks.", brand: "Common Thread", category: "apparel", price: 22, stockQuantity: 33, attributes: [["material", "Wool blend"], ["color", "Rust"], ["size", "One size"]] },
  { slug: "linework-overshirt", title: "Linework Overshirt", description: "Structured overshirt that works as a lightweight layer through changing seasons.", brand: "Common Thread", category: "apparel", price: 78, stockQuantity: 21, attributes: [["material", "Cotton twill"], ["color", "Slate"], ["size", "Large"]] },
  { slug: "summit-two-person-tent", title: "Summit Two-Person Tent", description: "Easy-pitch fictional tent with weather-ready fabric for weekend camping trips.", brand: "Trailmark", category: "camping", price: 189, stockQuantity: 11, attributes: [["capacity", "2 people"], ["material", "Ripstop polyester"], ["color", "Sunset"]] },
  { slug: "trail-insulated-bottle", title: "Trail Insulated Bottle", description: "Double-wall stainless bottle that keeps drinks ready for long days outside.", brand: "Trailmark", category: "camping", price: 32, stockQuantity: 48, attributes: [["capacity", "750 ml"], ["material", "Stainless steel"], ["color", "Blue"]] },
  { slug: "campfire-folding-chair", title: "Campfire Folding Chair", description: "Portable folding chair with durable fabric and a supportive high back.", brand: "Trailmark", category: "camping", price: 68, stockQuantity: 24, attributes: [["material", "Aluminum"], ["color", "Charcoal"], ["capacity", "120 kg"]] },
  { slug: "after-the-storm", title: "After the Storm", description: "A fictional contemporary novel about rebuilding a coastal town after a changing season.", brand: "River Press", category: "fiction", price: 18, stockQuantity: 70, attributes: [["format", "Paperback"], ["material", "Paper"], ["size", "Standard"]] },
  { slug: "small-worlds", title: "Small Worlds", description: "A fictional collection of short stories about curiosity, chance, and connection.", brand: "River Press", category: "fiction", price: 16, stockQuantity: 62, attributes: [["format", "Hardcover"], ["material", "Paper"], ["size", "Standard"]] },
  { slug: "daily-gentle-cleanser", title: "Daily Gentle Cleanser", description: "A fragrance-free fictional facial cleanser formulated for a simple daily routine.", brand: "Kind Form", category: "beauty", price: 17, stockQuantity: 52, attributes: [["capacity", "150 ml"], ["material", "Gel"], ["color", "Clear"]] },
  { slug: "night-recovery-cream", title: "Night Recovery Cream", description: "Rich fictional nighttime cream with a smooth, comfortable finish.", brand: "Kind Form", category: "beauty", price: 29, stockQuantity: 38, attributes: [["capacity", "50 ml"], ["material", "Cream"], ["color", "Ivory"]] },
  { slug: "soft-bristle-brush-set", title: "Soft Bristle Brush Set", description: "A practical set of synthetic-bristle cosmetic brushes for everyday application.", brand: "Kind Form", category: "beauty", price: 34, stockQuantity: 26, attributes: [["material", "Synthetic fiber"], ["color", "Rose"], ["capacity", "5 pieces"]] },
];

const imageUrl = (title: string, variant = 1) => `https://placehold.co/800x600/0f766e/ffffff?text=${encodeURIComponent(`${title} ${variant}`)}`;

async function main() {
  const seededPasswordHash = await bcrypt.hash("development-seed-account-not-for-login", 12);
  const sellerUser = await prisma.user.upsert({
    where: { email: "catalog@bestvalue.test" },
    update: {},
    create: { email: "catalog@bestvalue.test", passwordHash: seededPasswordHash, firstName: "Best", lastName: "Value Catalog", role: UserRole.SELLER },
  });
  const seller = await prisma.seller.upsert({
    where: { slug: "best-value-demo-store" },
    update: { storeName: "Best Value Demo Store", description: "Development catalog seller for Best Value." },
    create: { userId: sellerUser.id, storeName: "Best Value Demo Store", slug: "best-value-demo-store", description: "Development catalog seller for Best Value.", status: "ACTIVE" },
  });

  const categoryIds = new Map<string, string>();
  for (const category of categorySeeds) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, parentId: category.parent ? categoryIds.get(category.parent) : null },
      create: { name: category.name, slug: category.slug, parentId: category.parent ? categoryIds.get(category.parent) : null },
    });
    categoryIds.set(category.slug, saved.id);
  }

  const attributeIds = new Map<string, string>();
  for (const [code, name] of attributeSeeds) {
    const attribute = await prisma.attribute.upsert({ where: { code }, update: { name }, create: { code, name } });
    attributeIds.set(code, attribute.id);
  }

  for (const productSeed of products) {
    const product = await prisma.product.upsert({
      where: { slug: productSeed.slug },
      update: {
        sellerId: seller.id, categoryId: categoryIds.get(productSeed.category)!, title: productSeed.title, description: productSeed.description,
        brand: productSeed.brand, basePrice: productSeed.price, stockQuantity: productSeed.stockQuantity, status: ProductStatus.ACTIVE,
      },
      create: {
        sellerId: seller.id, categoryId: categoryIds.get(productSeed.category)!, title: productSeed.title, slug: productSeed.slug,
        description: productSeed.description, brand: productSeed.brand, basePrice: productSeed.price, stockQuantity: productSeed.stockQuantity, status: ProductStatus.ACTIVE,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productAttribute.deleteMany({ where: { productId: product.id } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({ data: [1, 2].map((position) => ({ productId: product.id, url: imageUrl(productSeed.title, position), altText: `${productSeed.title} placeholder image ${position}`, position: position - 1 })) });
    await prisma.productAttribute.createMany({ data: productSeed.attributes.map(([code, value]) => ({ productId: product.id, attributeId: attributeIds.get(code)!, value })) });

    for (const variantSeed of productSeed.variants ?? []) {
      const variant = await prisma.productVariant.create({ data: { productId: product.id, sku: variantSeed.sku, price: variantSeed.price, stockQuantity: variantSeed.stockQuantity } });
      await prisma.productVariantAttribute.createMany({ data: variantSeed.attributes.map(([code, value]) => ({ variantId: variant.id, attributeId: attributeIds.get(code)!, value })) });
    }
  }

  console.info(`Seeded ${products.length} active products across ${categorySeeds.length} categories.`);
}

main()
  .catch((error: unknown) => { console.error("Catalog seed failed", error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
