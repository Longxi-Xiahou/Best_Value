"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export default function RegisterPage() {
  const { register, user, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/account");
  }, [isLoading, router, user]);

  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ ...form, lastName: form.lastName || undefined });
      router.push("/account");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-2 text-slate-600">Join Best Value to prepare for the marketplace launch.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">First name<input required autoComplete="given-name" value={form.firstName} onChange={update("firstName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Last name<input autoComplete="family-name" value={form.lastName} onChange={update("lastName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={form.email} onChange={update("email")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required type="password" minLength={12} autoComplete="new-password" value={form.password} onChange={update("password")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /><span className="mt-1 block text-xs font-normal text-slate-500">Use at least 12 characters.</span></label>
        <button disabled={isSubmitting} className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-900">Log in</Link>.</p>
    </section>
  );
}
