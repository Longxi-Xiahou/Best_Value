"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { RecommendationStrip } from "@/components/recommendation-strip";

export default function AccountPage() {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, router, user]);

  if (isLoading) return <section className="mx-auto max-w-3xl px-4 py-16"><p className="text-slate-600">Loading your account…</p></section>;
  if (!user) return <section className="mx-auto max-w-3xl px-4 py-16"><p className="text-slate-600">Redirecting to login…</p></section>;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Best Value customer";
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Your account</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Hello, {user.firstName ?? "there"}</h1>
      {error && <p role="alert" className="mt-5 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
      <dl className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-1 px-6 py-5 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">Name</dt><dd className="text-slate-900 sm:col-span-2">{fullName}</dd></div>
        <div className="grid gap-1 px-6 py-5 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">Email</dt><dd className="text-slate-900 sm:col-span-2">{user.email}</dd></div>
        <div className="grid gap-1 px-6 py-5 sm:grid-cols-3"><dt className="text-sm font-medium text-slate-500">Account type</dt><dd className="text-slate-900 sm:col-span-2">{user.role.toLowerCase()}</dd></div>
      </dl>
      <Link href="/" className="mt-8 inline-flex font-semibold text-brand-600 hover:text-brand-900">← Continue browsing</Link>
      <RecommendationStrip mode="recent" />
    </section>
  );
}
