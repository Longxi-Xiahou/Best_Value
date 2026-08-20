import Link from "next/link";

export interface CategoryLink { id: string; name: string; slug: string; }

export function CategoryNavigation({ categories }: { categories: CategoryLink[] }) {
  return (
    <nav aria-label="Shop categories" className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-600">
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
