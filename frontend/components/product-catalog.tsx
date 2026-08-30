"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiClientError, getCategories, getProducts, getSearchSuggestions, type ProductQuery } from "@/lib/api";
import type { Category, ProductListResult } from "@/types/product";
import { CategoryNavigation } from "./category-navigation";
import { ProductCard } from "./product-card";

interface ProductCatalogProps {
  title?: string;
  initialCategory?: string;
}

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function ProductCatalog({ title = "Browse products", initialCategory }: ProductCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [catalog, setCatalog] = useState<ProductListResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [brandInput, setBrandInput] = useState("");
  const [sellerInput, setSellerInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const currentQuery = useMemo(() => {
    const params = new URLSearchParams(queryString);
    return {
      page: parsePositiveInt(params.get("page"), 1),
      limit: 12,
      search: params.get("q") ?? params.get("search") ?? "",
      category: initialCategory ?? params.get("category") ?? "",
      minPrice: params.get("minPrice") ?? "",
      maxPrice: params.get("maxPrice") ?? "",
      brand: params.get("brand") ?? "",
      seller: params.get("seller") ?? "",
      sort: params.get("sort") ?? "relevance",
      order: params.get("order") ?? "",
    };
  }, [initialCategory, queryString]);

  useEffect(() => {
    setSearchInput(currentQuery.search);
    setMinPriceInput(currentQuery.minPrice);
    setMaxPriceInput(currentQuery.maxPrice);
    setBrandInput(currentQuery.brand);
    setSellerInput(currentQuery.seller);
  }, [currentQuery.brand, currentQuery.maxPrice, currentQuery.minPrice, currentQuery.search, currentQuery.seller]);

  useEffect(() => { if (searchInput.trim().length < 2) { setSuggestions([]); return; } const timer = window.setTimeout(() => { void getSearchSuggestions(searchInput.trim()).then(({ items }) => setSuggestions(items)).catch(() => setSuggestions([])); }, 200); return () => window.clearTimeout(timer); }, [searchInput]);

  useEffect(() => {
    let active = true;
    void getCategories().then(({ items }) => { if (active) setCategories(items); }).catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    const query: ProductQuery = {
      page: currentQuery.page, limit: currentQuery.limit, search: currentQuery.search || undefined,
      category: currentQuery.category || undefined, minPrice: currentQuery.minPrice || undefined, maxPrice: currentQuery.maxPrice || undefined, brand: currentQuery.brand || undefined, seller: currentQuery.seller || undefined,
      sort: currentQuery.sort as ProductQuery["sort"], order: currentQuery.order as ProductQuery["order"],
    };
    void getProducts(query)
      .then((result) => { if (active) setCatalog(result); })
      .catch((requestError: unknown) => {
        if (!active) return;
        setCatalog(null);
        if (requestError instanceof ApiClientError && requestError.status === 404 && initialCategory) setError("Category not found.");
        else setError(requestError instanceof ApiClientError ? requestError.message : "Unable to load products. Please try again.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [currentQuery, initialCategory]);

  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(queryString);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    if (initialCategory) params.delete("category");
    const next = params.toString();
    router.push(`${pathname}${next ? `?${next}` : ""}`);
  };

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery({ search: searchInput.trim() || undefined, minPrice: minPriceInput || undefined, maxPrice: maxPriceInput || undefined, brand: brandInput.trim() || undefined, seller: sellerInput.trim() || undefined, page: 1 });
  };

  const sortValue = currentQuery.sort === "price" ? `price-${currentQuery.order || "asc"}` : currentQuery.sort;
  const updateSort = (value: string) => {
    if (value === "price-asc") updateQuery({ sort: "price", order: "asc", page: 1 });
    else if (value === "price-desc") updateQuery({ sort: "price", order: "desc", page: 1 });
    else updateQuery({ sort: value, order: undefined, page: 1 });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Catalog</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1></div>
        {catalog && <p className="text-sm text-slate-600">{catalog.pagination.total} product{catalog.pagination.total === 1 ? "" : "s"}</p>}
      </div>
      <div className="mt-7"><CategoryNavigation categories={categories} /></div>
      <form onSubmit={submitFilters} className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_150px_150px_180px_auto]">
        <div className="relative"><label className="sr-only" htmlFor="product-search">Search products</label><input id="product-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search products" className="w-full rounded-md border border-slate-300 px-3 py-2" />{suggestions.length > 0 && <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg">{suggestions.map((suggestion) => <li key={suggestion}><button type="button" onClick={() => { setSearchInput(suggestion); setSuggestions([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50">{suggestion}</button></li>)}</ul>}</div>
        <input aria-label="Minimum price" type="number" min="0" step="0.01" value={minPriceInput} onChange={(event) => setMinPriceInput(event.target.value)} placeholder="Min price" className="rounded-md border border-slate-300 px-3 py-2" />
        <input aria-label="Maximum price" type="number" min="0" step="0.01" value={maxPriceInput} onChange={(event) => setMaxPriceInput(event.target.value)} placeholder="Max price" className="rounded-md border border-slate-300 px-3 py-2" />
        <input aria-label="Brand" value={brandInput} onChange={(event) => setBrandInput(event.target.value)} placeholder="Brand" className="rounded-md border border-slate-300 px-3 py-2" />
        <input aria-label="Seller ID or slug" value={sellerInput} onChange={(event) => setSellerInput(event.target.value)} placeholder="Seller" className="rounded-md border border-slate-300 px-3 py-2" />
        <select aria-label="Sort products" value={sortValue} onChange={(event) => updateSort(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2"><option value="relevance">Latest</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select>
        <button className="rounded-md bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-900">Apply</button>
      </form>
      <div className="mt-3"><button type="button" onClick={() => { setSearchInput(""); setMinPriceInput(""); setMaxPriceInput(""); updateQuery({ search: undefined, minPrice: undefined, maxPrice: undefined, sort: undefined, order: undefined, page: 1 }); }} className="text-sm font-medium text-brand-600 hover:text-brand-900">Clear filters</button></div>
      {isLoading ? <p className="py-16 text-center text-slate-600">Loading products…</p> : error ? <div className="py-16 text-center"><h2 className="text-xl font-semibold">{error}</h2><button type="button" onClick={() => updateQuery({ page: 1 })} className="mt-4 font-semibold text-brand-600">Try again</button></div> : catalog?.items.length ? <>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{catalog.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        {catalog.pagination.totalPages > 1 && <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Product pagination"><button type="button" disabled={catalog.pagination.page === 1} onClick={() => updateQuery({ page: catalog.pagination.page - 1 })} className="rounded-md border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span className="text-sm text-slate-600">Page {catalog.pagination.page} of {catalog.pagination.totalPages}</span><button type="button" disabled={catalog.pagination.page === catalog.pagination.totalPages} onClick={() => updateQuery({ page: catalog.pagination.page + 1 })} className="rounded-md border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50">Next</button></nav>}
      </> : <div className="py-16 text-center"><h2 className="text-xl font-semibold">No products found</h2><p className="mt-2 text-slate-600">Try changing your search or filters.</p></div>}
    </section>
  );
}
