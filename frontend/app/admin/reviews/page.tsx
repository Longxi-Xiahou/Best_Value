"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError, getAdminReviewReports, moderateAdminReview, resolveAdminReviewReport } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export default function AdminReviewsPage() {
  const { user, isLoading } = useAuth(); const [reports, setReports] = useState<Awaited<ReturnType<typeof getAdminReviewReports>>["items"]>([]); const [error, setError] = useState<string | null>(null);
  const load = () => void getAdminReviewReports().then(({ items }) => setReports(items)).catch((e: unknown) => setError(e instanceof ApiClientError ? e.message : "Unable to load reports."));
  useEffect(() => { if (user?.role === "ADMIN") load(); }, [user]);
  if (isLoading) return <main className="mx-auto max-w-5xl px-4 py-16">Loading…</main>;
  if (!user || user.role !== "ADMIN") return <main className="mx-auto max-w-5xl px-4 py-16"><h1 className="text-3xl font-bold">Administrator access required</h1><Link href="/" className="mt-4 inline-block text-brand-600">Return home</Link></main>;
  return <main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-bold">Review moderation</h1>{error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}<div className="mt-6 space-y-4">{reports.length ? reports.map((report) => <article key={report.id} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><p className="font-semibold">{report.review.product.title} · {report.reason}</p><span className="text-sm text-slate-500">{report.status}</span></div><p className="mt-2 text-slate-700">{report.review.body}</p><p className="mt-1 text-sm text-slate-500">Reported by {report.reporter}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void moderateAdminReview(report.review.id, "HIDE").then(load).catch(() => setError("Unable to hide review."))} className="rounded bg-amber-600 px-3 py-2 text-sm font-semibold text-white">Hide</button><button type="button" onClick={() => void moderateAdminReview(report.review.id, "REMOVE").then(load).catch(() => setError("Unable to remove review."))} className="rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white">Remove</button><button type="button" onClick={() => void moderateAdminReview(report.review.id, "RESTORE").then(load).catch(() => setError("Unable to restore review."))} className="rounded border px-3 py-2 text-sm">Restore</button><button type="button" onClick={() => void resolveAdminReviewReport(report.id, "DISMISSED").then(load).catch(() => setError("Unable to dismiss report."))} className="rounded border px-3 py-2 text-sm">Dismiss report</button></div></article>) : <p className="rounded border border-dashed p-8 text-slate-600">No review reports.</p>}</div></main>;
}
