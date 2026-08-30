"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ApiClientError, createOrder, getCart, getShippingMethods } from "@/lib/api";
import type { Cart } from "@/types/product";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export function CheckoutPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [shippingMethods, setShippingMethods] = useState<Array<{ id: string; name: string; estimatedDelivery: string; price: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "US", shippingMethodId: "STANDARD" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?next=/checkout"); return; }
    void Promise.all([getCart(), getShippingMethods()]).then(([loadedCart, methods]) => { setCart(loadedCart); setShippingMethods(methods.items); }).catch((requestError: unknown) => setError(requestError instanceof ApiClientError ? requestError.message : "Unable to load checkout.")).finally(() => setIsLoading(false));
  }, [authLoading, router, user]);

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(null); setIsSubmitting(true); try { const { shippingMethodId, ...shippingAddress } = form; const { order } = await createOrder({ ...shippingAddress, addressLine2: form.addressLine2 || undefined, state: form.state || undefined }, shippingMethodId); router.push(`/orders/${order.id}`); } catch (requestError) { setError(requestError instanceof ApiClientError ? requestError.message : "Unable to place your order."); } finally { setIsSubmitting(false); } };

  if (authLoading || isLoading) return <section className="mx-auto max-w-7xl px-4 py-16 text-slate-600">Loading checkout…</section>;
  if (!user) return <section className="mx-auto max-w-7xl px-4 py-16 text-slate-600">Redirecting to login…</section>;
  if (error && !cart) return <section className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-2xl font-bold">Unable to load checkout</h1><p className="mt-2 text-slate-600">{error}</p></section>;
  if (!cart?.items.length) return <section className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-3xl font-bold">Your cart is empty</h1><Link href="/products" className="mt-5 inline-flex font-semibold text-brand-600">Browse products →</Link></section>;
  const selectedMethod = (() => { const method = shippingMethods.find((candidate) => candidate.id === form.shippingMethodId); return method ? { ...method, price: method.price * new Set(cart.items.map((item) => item.product.sellerId)).size } : undefined; })();
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Checkout</p><h1 className="mt-2 text-3xl font-bold">Shipping information</h1><p className="mt-2 text-slate-600">Shipping prices are calculated and verified by the server. Payment follows order placement in Stripe test mode.</p><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]"><form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-red-700">{error}</p>}<label className="block text-sm font-medium">Full name<input required value={form.fullName} onChange={update("fullName")} autoComplete="name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium">Address line 1<input required value={form.addressLine1} onChange={update("addressLine1")} autoComplete="address-line1" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium">Address line 2 <span className="font-normal text-slate-500">(optional)</span><input value={form.addressLine2} onChange={update("addressLine2")} autoComplete="address-line2" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">City<input required value={form.city} onChange={update("city")} autoComplete="address-level2" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium">State<input value={form.state} onChange={update("state")} autoComplete="address-level1" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label></div><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Postal code<input required value={form.postalCode} onChange={update("postalCode")} autoComplete="postal-code" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium">Country<input required maxLength={2} value={form.country} onChange={update("country")} autoComplete="country" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 uppercase" /></label></div><label className="block text-sm font-medium">Shipping method<select value={form.shippingMethodId} onChange={update("shippingMethodId")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">{shippingMethods.map((method) => <option key={method.id} value={method.id}>{method.name} · {money(method.price, cart.currency)} · {method.estimatedDelivery}</option>)}</select></label><button disabled={isSubmitting} className="w-full rounded-md bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-900 disabled:opacity-60">{isSubmitting ? "Placing order…" : "Place order"}</button></form><aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Order summary</h2><div className="mt-4 space-y-3">{cart.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-slate-600">{item.product.title} × {item.quantity}</span><span className="font-medium">{money(item.lineTotal, item.currency)}</span></div>)}</div><div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{money(cart.subtotal, cart.currency)}</span></div><div className="flex justify-between"><span className="text-slate-600">Shipping{selectedMethod ? ` · ${selectedMethod.name}` : ""}</span><span>{money(selectedMethod?.price ?? 0, cart.currency)}</span></div><div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold"><span>Estimated total</span><span>{money(cart.subtotal + (selectedMethod?.price ?? 0), cart.currency)}</span></div></div></aside></div></section>;
}
