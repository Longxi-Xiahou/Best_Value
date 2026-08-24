"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/account");
  }, [isLoading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      router.push(nextPath?.startsWith("/") ? nextPath : "/account");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "Unable to log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-slate-600">Log in to access your Best Value account.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <button disabled={isSubmitting} className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">New to Best Value? <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-900">Create an account</Link>.</p>
    </section>
  );
}
