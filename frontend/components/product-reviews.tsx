"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiClientError, createProductReview, getProductReviews } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { ReviewResult } from "@/types/product";

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ rating: "5", title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const load = () => void getProductReviews(productId).then(setReviews).catch((e: unknown) => setError(e instanceof ApiClientError ? e.message : "Unable to load reviews."));
  useEffect(() => { load(); }, [productId]);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSubmitting(true); setError(null); try { await createProductReview(productId, { rating: Number(form.rating), title: form.title || undefined, body: form.body }); setForm({ rating: "5", title: "", body: "" }); load(); } catch (e) { setError(e instanceof ApiClientError ? e.message : "Unable to submit review."); } finally { setSubmitting(false); } };
  return <section className="mt-12 border-t border-slate-200 pt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Customer reviews</h2><p className="mt-1 text-slate-600">{reviews ? `${reviews.averageRating.toFixed(1)} / 5 · ${reviews.reviewCount} review${reviews.reviewCount === 1 ? "" : "s"}` : "Loading reviews…"}</p></div></div>{error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{user && <form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-[120px_1fr]"><label className="text-sm font-medium">Rating<select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="mt-1 w-full rounded border px-2 py-2">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</select></label><label className="text-sm font-medium">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded border px-2 py-2" /></label><label className="text-sm font-medium md:col-span-2">Review<textarea required minLength={1} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-1 min-h-24 w-full rounded border px-2 py-2" /></label><button disabled={submitting} className="rounded bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60 md:col-span-2">{submitting ? "Submitting…" : "Submit review"}</button></form>}{reviews?.items.length ? <div className="mt-6 space-y-4">{reviews.items.map((review) => <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><div><p className="font-semibold">{review.title || "Review"}</p><p className="text-sm text-amber-700">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p></div><p className="text-sm text-slate-500">{review.author}</p></div><p className="mt-3 text-slate-700">{review.body}</p></article>)}</div> : !error && <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-slate-600">No reviews yet.</p>}</section>;
}
