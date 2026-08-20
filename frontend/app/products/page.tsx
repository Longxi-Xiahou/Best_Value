import Link from "next/link";

export default function ProductsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Catalog</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Products are next.</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">This route is ready for the Phase 3 product listing API. The catalog will be served exclusively by the Express backend.</p>
      <Link href="/" className="mt-8 inline-flex font-semibold text-brand-600 hover:text-brand-900">← Return home</Link>
    </section>
  );
}
