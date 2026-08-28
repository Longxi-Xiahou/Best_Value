"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ApiClientError, getOrders } from "@/lib/api";
import type { OrderSummary } from "@/types/product";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
const date = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));

export function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!authLoading && user) void getOrders().then(({ items }) => setOrders(items)).catch((requestError: unknown) => setError(requestError instanceof ApiClientError ? requestError.message : "Unable to load orders.")).finally(() => setIsLoading(false)); else if (!authLoading) setIsLoading(false); }, [authLoading, user]);
  if (authLoading || isLoading) return <section className="mx-auto max-w-5xl px-4 py-16 text-slate-600">Loading orders…</section>;
  if (!user) return <section className="mx-auto max-w-5xl px-4 py-16"><h1 className="text-3xl font-bold">Sign in to view orders</h1><Link href="/login" className="mt-5 inline-flex rounded-md bg-brand-600 px-5 py-2.5 font-semibold text-white">Log in</Link></section>;
  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Account</p><h1 className="mt-2 text-3xl font-bold">Order history</h1>{error ? <p role="alert" className="mt-8 rounded-md bg-red-50 p-4 text-red-700">{error}</p> : orders.length ? <div className="mt-8 space-y-4">{orders.map((order) => <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-500"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Order {order.id}</p><p className="mt-1 text-sm text-slate-600">{date(order.createdAt)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}</p></div><div className="text-right"><p className="font-bold">{money(order.total, order.currency)}</p><p className="mt-1 text-sm capitalize text-slate-600">{order.status.toLowerCase()} · payment {order.paymentStatus.toLowerCase()}</p></div></div><p className="mt-4 text-sm text-slate-600">{order.previewItems.map((item) => `${item.productName}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`).join(" · ")}</p></Link>)}</div> : <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center"><h2 className="text-xl font-semibold">No orders yet</h2><p className="mt-2 text-slate-600">Your placed orders will appear here.</p><Link href="/products" className="mt-5 inline-flex font-semibold text-brand-600">Browse products →</Link></div>}</section>;
}
