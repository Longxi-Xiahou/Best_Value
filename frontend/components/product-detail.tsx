"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiClientError, getProduct } from "@/lib/api";
import type { ProductDetail as ProductDetailType } from "@/types/product";

const formatPrice = (price: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);

export function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    void getProduct(id)
      .then(({ product: loadedProduct }) => {
        if (!active) return;
        setProduct(loadedProduct);
        setSelectedImageIndex(0);
        setSelectedVariantId(loadedProduct.variants[0]?.id ?? "");
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof ApiClientError && requestError.status === 404 ? "Product not found." : requestError instanceof ApiClientError ? requestError.message : "Unable to load this product.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (isLoading) return <section className="mx-auto max-w-7xl px-4 py-16 text-slate-600">Loading product…</section>;
  if (error || !product) return <section className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-3xl font-bold">{error ?? "Product not found."}</h1><Link href="/products" className="mt-5 inline-flex font-semibold text-brand-600">← Browse products</Link></section>;

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const price = selectedVariant?.price ?? product.price;
  const inStock = selectedVariant ? selectedVariant.inStock : product.inStock;
  const image = product.images[selectedImageIndex];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600"><Link href="/products" className="hover:text-brand-600">Products</Link><span className="px-2">/</span><Link href={`/categories/${product.category.slug}`} className="hover:text-brand-600">{product.category.name}</Link></nav>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {image ? <img src={image.url} alt={image.altText ?? product.title} className="h-full w-full object-cover" /> : <span className="text-slate-400">No image available</span>}
          </div>
          {product.images.length > 1 && <div className="mt-4 flex gap-3 overflow-x-auto">{product.images.map((thumbnail, index) => <button type="button" key={thumbnail.id} onClick={() => setSelectedImageIndex(index)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 ${index === selectedImageIndex ? "border-brand-600" : "border-transparent"}`} aria-label={`View image ${index + 1}`}><img src={thumbnail.url} alt={thumbnail.altText ?? ""} className="h-full w-full object-cover" /></button>)}</div>}
        </div>
        <div className="space-y-6">
          <div><p className="text-sm font-semibold text-brand-600">{product.category.name}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{product.title}</h1>{product.brand && <p className="mt-2 text-slate-600">by {product.brand}</p>}</div>
          <p className="text-3xl font-bold text-brand-900">{formatPrice(price, product.currency)}</p>
          <p className={`font-semibold ${inStock ? "text-emerald-700" : "text-slate-500"}`}>{inStock ? "In stock" : "Currently unavailable"}</p>
          {product.variants.length > 0 && <label className="block text-sm font-semibold text-slate-700">Choose an option<select value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2">{product.variants.map((variant) => <option key={variant.id} value={variant.id} disabled={!variant.inStock}>{variant.attributes.map((attribute) => `${attribute.name}: ${attribute.value}`).join(" · ")}{variant.inStock ? "" : " (unavailable)"}</option>)}</select></label>}
          <p className="leading-7 text-slate-700">{product.description}</p>
          {product.attributes.length > 0 && <div><h2 className="text-lg font-semibold">Product details</h2><dl className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200">{product.attributes.map((attribute) => <div key={attribute.code} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm"><dt className="font-medium text-slate-600">{attribute.name}</dt><dd>{attribute.value}</dd></div>)}</dl></div>}
          <div className="rounded-lg bg-slate-50 p-4 text-sm"><p className="font-semibold text-slate-800">Sold by {product.seller.storeName}</p>{product.seller.description && <p className="mt-1 text-slate-600">{product.seller.description}</p>}</div>
        </div>
      </div>
    </section>
  );
}
