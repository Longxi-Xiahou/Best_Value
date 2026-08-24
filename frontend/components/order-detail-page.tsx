"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ApiClientError, getOrder } from "@/lib/api";
import type { OrderDetail } from "@/types/product";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export function OrderDetailPage({ id }: { id: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { if (!authLoading && user) void getOrder(id).then(({ order: loaded }) => setOrder(loaded)).catch((requestError: unknown) => setError(requestError instanceof ApiClientError && requestError.status === 404 ? "Order not found." : "Unable to load this order.")).finally(() => setIsLoading(false)); else if (!authLoading) setIsLoading(false); }, [authLoading, id, user]);
  if (authLoading || isLoading) return <section className="mx-auto max-w-5xl px-4 py-16 text-slate-600">Loading order…</section>;
  if (!user) return <section className="mx-auto max-w-5xl px-4 py-16"><h1 className="text-3xl font-bold">Sign in to view this order</h1><Link href="/login" className="mt-5 inline-flex font-semibold text-brand-600">Log in →</Link></section>;
  if (error || !order) return <section className="mx-auto max-w-5xl px-4 py-16"><h1 className="text-3xl font-bold">{error ?? "Order not found."}</h1><Link href="/orders" className="mt-5 inline-flex font-semibold text-brand-600">← Order history</Link></section>;
  const address = order.shippingAddress;
  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><Link href="/orders" className="text-sm font-semibold text-brand-600">← Order history</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Order details</p><h1 className="mt-2 text-3xl font-bold">{order.id}</h1></div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold capitalize text-amber-800">{order.status.toLowerCase()}</span></div><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]"><div className="space-y-4">{order.items.map((item) => <article key={item.id} className="flex justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="font-semibold">{item.productName}</h2>{item.variantName && <p className="mt-1 text-sm text-slate-600">{item.variantName}</p>}<p className="mt-2 text-sm text-slate-600">{item.quantity} × {money(item.unitPrice, order.currency)}</p></div><p className="font-bold">{money(item.totalPrice, order.currency)}</p></article>)}</div><aside className="h-fit space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="font-semibold">Shipping to</h2><p className="mt-2 text-sm leading-6 text-slate-600">{address.fullName}<br />{address.addressLine1}{address.addressLine2 && <><br />{address.addressLine2}</>}<br />{address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}<br />{address.country}</p></div><div className="border-t border-slate-200 pt-4"><div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span>{money(order.subtotal, order.currency)}</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-slate-600">Shipping</span><span>{money(order.shipping, order.currency)}</span></div><div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold"><span>Total</span><span>{money(order.total, order.currency)}</span></div></div></aside></div></section>;
}
