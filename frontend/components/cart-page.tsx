"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ApiClientError, getCart, removeCartItem, updateCartItem } from "@/lib/api";
import type { Cart } from "@/types/product";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export function CartPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCart = async () => {
    setIsLoading(true);
    setError(null);
    try { setCart(await getCart()); }
    catch (requestError) { setError(requestError instanceof ApiClientError ? requestError.message : "Unable to load your cart."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (user) void loadCart(); else if (!authLoading) setIsLoading(false); }, [authLoading, user]);

  const changeQuantity = async (id: string, quantity: number) => {
    setBusyId(id); setError(null);
    try { setCart(await updateCartItem(id, quantity)); }
    catch (requestError) { setError(requestError instanceof ApiClientError ? requestError.message : "Unable to update your cart."); }
    finally { setBusyId(null); }
  };

  const remove = async (id: string) => {
    setBusyId(id); setError(null);
    try { setCart(await removeCartItem(id)); }
    catch (requestError) { setError(requestError instanceof ApiClientError ? requestError.message : "Unable to remove that item."); }
    finally { setBusyId(null); }
  };

  if (authLoading || isLoading) return <section className="mx-auto max-w-7xl px-4 py-16 text-slate-600">Loading your cart…</section>;
  if (!user) return <section className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-3xl font-bold">Sign in to view your cart</h1><Link href="/login" className="mt-5 inline-flex rounded-md bg-brand-600 px-5 py-2.5 font-semibold text-white">Log in</Link></section>;
  if (error && !cart) return <section className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-2xl font-bold">Unable to load your cart</h1><p className="mt-2 text-slate-600">{error}</p><button type="button" onClick={() => void loadCart()} className="mt-5 font-semibold text-brand-600">Try again</button></section>;
  if (!cart?.items.length) return <section className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-3xl font-bold">Your cart is empty</h1><p className="mt-2 text-slate-600">Find something useful for your next order.</p><Link href="/products" className="mt-6 inline-flex rounded-md bg-brand-600 px-5 py-2.5 font-semibold text-white">Browse products</Link></section>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Shopping cart</p><h1 className="mt-2 text-3xl font-bold">Review your items</h1></div><span className="text-sm text-slate-600">{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}</span></div>
      {error && <p role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">{cart.items.map((item) => <article key={item.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><Link href={`/products/${item.product.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">{item.product.image ? <img src={item.product.image.url} alt={item.product.image.altText ?? item.product.title} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-slate-400">No image</span>}</Link><div className="min-w-0 flex-1"><Link href={`/products/${item.product.id}`} className="font-semibold hover:text-brand-600">{item.product.title}</Link>{item.variant?.label && <p className="mt-1 text-sm text-slate-600">{item.variant.label}</p>}<p className="mt-2 text-sm font-medium text-slate-900">{money(item.unitPrice, item.currency)} each</p><p className="mt-1 text-xs text-slate-500">{item.availableStock} available</p></div><div className="flex flex-col items-end justify-between"><p className="font-bold">{money(item.lineTotal, item.currency)}</p><div className="flex items-center gap-2"><button type="button" disabled={busyId === item.id || item.quantity <= 1} onClick={() => void changeQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity" className="h-8 w-8 rounded border disabled:opacity-40">−</button><span className="w-6 text-center text-sm">{item.quantity}</span><button type="button" disabled={busyId === item.id || item.quantity >= item.availableStock} onClick={() => void changeQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity" className="h-8 w-8 rounded border disabled:opacity-40">+</button></div><button type="button" disabled={busyId === item.id} onClick={() => void remove(item.id)} className="text-xs font-semibold text-red-600 hover:text-red-800">Remove</button></div></article>)}</div>
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Order summary</h2><div className="mt-5 flex justify-between border-t border-slate-200 pt-4"><span className="text-slate-600">Subtotal</span><span className="font-bold">{money(cart.subtotal, cart.currency)}</span></div><p className="mt-3 text-xs text-slate-500">Shipping and taxes are calculated at order placement. Payments are not processed in this phase.</p><Link href="/checkout" className="mt-6 block rounded-md bg-brand-600 px-4 py-3 text-center font-semibold text-white hover:bg-brand-900">Proceed to checkout</Link></aside>
      </div>
    </section>
  );
}
