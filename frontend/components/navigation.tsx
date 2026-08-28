"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

const navItems = [
  { href: "/products", label: "Products" },
];

export function Navigation() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-900">Best Value</Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="hover:text-brand-600">{item.label}</Link>)}
          </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          {isLoading ? <span className="text-slate-500">Loading…</span> : user ? <>
            <Link href="/account" className="text-slate-700 hover:text-brand-600">Account</Link>
            <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="rounded-md bg-slate-100 px-4 py-2 text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60">
              {isLoggingOut ? "Signing out…" : "Log out"}
            </button>
            <Link href="/cart" className="text-slate-700 hover:text-brand-600">Cart</Link>
            <Link href="/orders" className="text-slate-700 hover:text-brand-600">Orders</Link>
            <Link href="/seller" className="text-slate-700 hover:text-brand-600">Sell</Link>
          </> : <>
            <Link href="/login" className="text-slate-700 hover:text-brand-600">Log in</Link>
            <Link href="/register" className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-900">Register</Link>
          </>}
        </div>
      </nav>
    </header>
  );
}
