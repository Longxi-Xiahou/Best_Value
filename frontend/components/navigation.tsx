import Link from "next/link";

const navItems = [
  { href: "/products", label: "Products" },
];

export function Navigation() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-900">Best Value</Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="hover:text-brand-600">{item.label}</Link>)}
        </div>
        <span className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">Marketplace beta</span>
      </nav>
    </header>
  );
}
