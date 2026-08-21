import Link from "next/link";
import type { ProductSummary } from "@/types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/products/${product.id}`} className="block aspect-[4/3] bg-slate-100">
        {product.image ? <img src={product.image.url} alt={product.image.altText ?? product.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No image available</div>}
      </Link>
      <div className="space-y-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.category.name}</p>
        <h2 className="line-clamp-2 font-semibold text-slate-900"><Link href={`/products/${product.id}`}>{product.title}</Link></h2>
        <p className="font-bold text-brand-900">{new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price)}</p>
        <p className={`text-sm font-medium ${product.inStock ? "text-emerald-700" : "text-slate-500"}`}>{product.inStock ? "In stock" : "Currently unavailable"}{product.hasVariants ? " · Options available" : ""}</p>
      </div>
    </article>
  );
}
