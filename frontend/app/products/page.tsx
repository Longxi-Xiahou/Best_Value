import { Suspense } from "react";
import { ProductCatalog } from "@/components/product-catalog";

export default function ProductsPage() {
  return <Suspense fallback={<section className="mx-auto max-w-7xl px-4 py-16 text-slate-600">Loading catalog…</section>}><ProductCatalog /></Suspense>;
}
