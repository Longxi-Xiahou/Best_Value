import Link from "next/link";
import type { Category } from "@/types/product";

export function CategoryNavigation({ categories }: { categories: Category[] }) {
  return (
    <nav aria-label="Shop categories" className="flex flex-wrap gap-2">
      <Link href="/products" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-600">All products</Link>
      {categories.map((category) => (
        <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-600">
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
