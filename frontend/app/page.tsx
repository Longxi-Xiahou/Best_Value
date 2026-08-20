import Link from "next/link";
import { CategoryNavigation } from "@/components/category-navigation";
import { ProductCard } from "@/components/product-card";
import type { ProductSummary } from "@/types/product";

const starterCategories = [
  { id: "electronics", name: "Electronics", slug: "electronics" },
  { id: "home", name: "Home & Garden", slug: "home-garden" },
  { id: "fashion", name: "Fashion", slug: "fashion" },
  { id: "sports", name: "Sports & Outdoors", slug: "sports-outdoors" },
];

const previewProducts: ProductSummary[] = [
  { id: "preview-1", title: "Your marketplace catalog starts here", slug: "catalog-preview", price: 0, currency: "USD", categoryName: "Coming soon" },
  { id: "preview-2", title: "Flexible products and variants", slug: "variants-preview", price: 0, currency: "USD", categoryName: "Coming soon" },
  { id: "preview-3", title: "Built for every category", slug: "categories-preview", price: 0, currency: "USD", categoryName: "Coming soon" },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-brand-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-50">Marketplace foundation</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">More to discover. Better value every day.</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">Best Value is a multi-category marketplace designed to grow from first listing to a full catalog.</p>
          <Link href="/products" className="mt-8 inline-flex rounded-md bg-white px-5 py-3 font-semibold text-brand-900 hover:bg-brand-50">Browse products</Link>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">
        <div><h2 className="text-2xl font-bold">Shop by category</h2><p className="mt-1 text-slate-600">Categories can nest as deeply as the catalog needs.</p></div>
        <CategoryNavigation categories={starterCategories} />
        <div className="flex items-end justify-between"><div><h2 className="text-2xl font-bold">Ready for your catalog</h2><p className="mt-1 text-slate-600">Live product data arrives in Phase 3.</p></div><Link href="/products" className="text-sm font-semibold text-brand-600 hover:text-brand-900">View all</Link></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{previewProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
    </div>
  );
}
