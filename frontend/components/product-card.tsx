import Link from "next/link";
import type { ProductSummary } from "@/types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-sm text-slate-400">Product image</div>
      <div className="space-y-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.categoryName}</p>
        <h2 className="line-clamp-2 font-semibold text-slate-900"><Link href={`/products/${product.id}`}>{product.title}</Link></h2>
        <p className="font-bold text-brand-900">{new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price)}</p>
      </div>
    </article>
  );
}
