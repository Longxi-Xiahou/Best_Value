"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSellerProducts } from "@/lib/api";
import { SellerProductImport } from "@/components/seller-product-import";

type SellerProduct = { id: string; title: string; status: string; basePrice: number; stockQuantity: number; category: { name: string }; variants: Array<{ stockQuantity: number }> };

export function SellerProducts() {
  const [products, setProducts] = useState<SellerProduct[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getSellerProducts().then(({ items }) => setProducts(items as unknown as SellerProduct[])).catch(() => setError("Unable to load seller products.")); }, []);
  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Seller</p><h1 className="mt-2 text-3xl font-bold">Your products</h1></div><Link href="/seller/products/new" className="rounded bg-brand-600 px-4 py-2 font-semibold text-white">New product</Link></div>{error && <p className="mt-6 rounded bg-red-50 p-3 text-red-700">{error}</p>}{products.length ? <div className="mt-8 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Status</th><th className="p-4">Inventory</th><th className="p-4" /></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-b last:border-0"><td className="p-4 font-medium">{product.title}</td><td className="p-4">{product.category.name}</td><td className="p-4 capitalize">{product.status.toLowerCase()}</td><td className="p-4">{product.variants.length ? `${product.variants.reduce((sum, v) => sum + v.stockQuantity, 0)} across variants` : product.stockQuantity}</td><td className="p-4 text-right"><Link href={`/seller/products/${product.id}/edit`} className="font-semibold text-brand-600">Edit</Link></td></tr>)}</tbody></table></div> : !error && <p className="mt-8 rounded-xl border border-dashed p-10 text-center text-slate-600">No products yet.</p>}<SellerProductImport /></section>;
}
