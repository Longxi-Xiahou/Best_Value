"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryNavigation } from "@/components/category-navigation";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/api";
import type { Category, ProductSummary } from "@/types/product";
import { RecommendationStrip } from "@/components/recommendation-strip";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    void getCategories().then(({ items }) => setCategories(items)).catch(() => setCategories([]));
    void getProducts({ limit: 3, sort: "newest" }).then(({ items }) => setProducts(items)).catch(() => setProducts([]));
  }, []);

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
        <CategoryNavigation categories={categories} />
        <div className="flex items-end justify-between"><div><h2 className="text-2xl font-bold">Fresh in the catalog</h2><p className="mt-1 text-slate-600">Explore new products from across the marketplace.</p></div><Link href="/products" className="text-sm font-semibold text-brand-600 hover:text-brand-900">View all</Link></div>
        {products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="text-slate-600">Catalog products will appear here once available.</p>}
        <RecommendationStrip />
      </section>
    </div>
  );
}
