"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiClientError, getSellerDashboard, getSellerMe } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export function SellerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof getSellerDashboard>> | null>(null);
  const [seller, setSeller] = useState<{ storeName: string; slug: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!authLoading && user) void Promise.all([getSellerMe(), getSellerDashboard()]).then(([me, dashboard]) => { if (!me.seller) throw new Error("NO_SELLER"); setSeller(me.seller); setData(dashboard); }).catch((e: unknown) => setError(e instanceof ApiClientError ? e.message : "Seller profile required.")); }, [authLoading, user]);
  if (authLoading) return <section className="mx-auto max-w-6xl px-4 py-16 text-slate-600">Loading dashboard…</section>;
  if (!user) return <section className="mx-auto max-w-6xl px-4 py-16"><h1 className="text-3xl font-bold">Seller dashboard</h1><Link href="/login?next=/seller" className="mt-5 inline-flex font-semibold text-brand-600">Log in →</Link></section>;
  if (error) return <section className="mx-auto max-w-6xl px-4 py-16"><h1 className="text-3xl font-bold">Seller access required</h1><p className="mt-2 text-slate-600">Create a store profile to start selling.</p><Link href="/sell" className="mt-5 inline-flex rounded bg-brand-600 px-5 py-2.5 font-semibold text-white">Open a store</Link></section>;
  if (!data || !seller) return <section className="mx-auto max-w-6xl px-4 py-16 text-slate-600">Loading dashboard…</section>;
  const lowStockCount = data.lowStockProducts.length + data.lowStockVariants.length;
  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Seller dashboard</p><h1 className="mt-2 text-3xl font-bold">{seller.storeName}</h1></div><Link href={`/sellers/${seller.slug}`} className="font-semibold text-brand-600">View public store</Link></div><nav className="mt-7 flex flex-wrap gap-3 text-sm"><Link href="/seller/products" className="rounded border px-4 py-2">Products</Link><Link href="/seller/orders" className="rounded border px-4 py-2">Orders</Link><Link href="/seller/products/new" className="rounded bg-brand-600 px-4 py-2 font-semibold text-white">New product</Link></nav><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Total products</p><p className="mt-2 text-3xl font-bold">{data.totalProducts}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Active products</p><p className="mt-2 text-3xl font-bold">{data.activeProducts}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Low stock</p><p className="mt-2 text-3xl font-bold">{lowStockCount}</p></div></div><div className="mt-8 rounded-xl border bg-white p-5"><h2 className="font-semibold">Low-stock inventory</h2>{lowStockCount ? <ul className="mt-4 divide-y">{data.lowStockProducts.map((item) => <li key={item.id} className="flex justify-between py-3"><span>{item.title}</span><span className="text-red-600">{item.stockQuantity} left</span></li>)}{data.lowStockVariants.map((item) => <li key={item.id} className="flex justify-between py-3"><span>{item.product.title} <span className="text-slate-500">({item.sku})</span></span><span className="text-red-600">{item.stockQuantity} left</span></li>)}</ul> : <p className="mt-3 text-slate-600">No low-stock inventory.</p>}</div></section>;
}
