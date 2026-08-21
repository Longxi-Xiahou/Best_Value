import { Suspense } from "react";
import { ProductCatalog } from "@/components/product-catalog";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Suspense fallback={<section className="mx-auto max-w-7xl px-4 py-16 text-slate-600">Loading category…</section>}><ProductCatalog title="Category products" initialCategory={slug} /></Suspense>;
}
