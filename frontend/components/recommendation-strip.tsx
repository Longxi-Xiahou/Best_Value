"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getRecommendations, getRecentlyViewed } from "@/lib/api";
import type { ProductSummary } from "@/types/product";
import { ProductCard } from "./product-card";

export function RecommendationStrip({ mode = "personalized" }: { mode?: "personalized" | "recent" }) {
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [label, setLabel] = useState("");
  useEffect(() => { if (isLoading || !user) return; const request = mode === "recent" ? getRecentlyViewed().then((result) => { setItems(result.items); setLabel("Recently viewed"); }) : getRecommendations().then((result) => { setItems(result.items); setLabel(result.personalized ? "Recommended for you" : "Popular picks"); }); void request.catch(() => setItems([])); }, [isLoading, mode, user]);
  if (!user || !items.length) return null;
  return <section className="mt-12"><h2 className="text-2xl font-bold">{label}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>;
}
