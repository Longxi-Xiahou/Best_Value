"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, getSellerMe, onboardSeller } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export function SellerOnboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [existing, setExisting] = useState(false);
  const [form, setForm] = useState({ storeName: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!authLoading && user) void getSellerMe().then(({ seller }) => setExisting(Boolean(seller))).catch(() => undefined); }, [authLoading, user]);
  if (authLoading) return <section className="mx-auto max-w-xl px-4 py-16 text-slate-600">Loading…</section>;
  if (!user) return <section className="mx-auto max-w-xl px-4 py-16"><h1 className="text-3xl font-bold">Become a seller</h1><Link href="/login?next=/sell" className="mt-5 inline-flex rounded bg-brand-600 px-5 py-2.5 font-semibold text-white">Log in to start</Link></section>;
  if (existing) { router.replace("/seller"); return <section className="mx-auto max-w-xl px-4 py-16 text-slate-600">Opening seller dashboard…</section>; }
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(null); try { await onboardSeller(form); router.push("/seller"); } catch (e) { setError(e instanceof ApiClientError ? e.message : "Unable to create your seller profile."); } finally { setSaving(false); } };
  return <section className="mx-auto max-w-xl px-4 py-12 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Seller onboarding</p><h1 className="mt-2 text-3xl font-bold">Open your store</h1><p className="mt-2 text-slate-600">Create a public store profile. Payment and payout details are not collected in this phase.</p><form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border bg-white p-6 shadow-sm">{error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Store name<input required minLength={2} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" /></label><label className="block text-sm font-medium">Public description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-32 w-full rounded border px-3 py-2" /></label><button disabled={saving} className="w-full rounded bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Creating store…" : "Create seller profile"}</button></form></section>;
}
