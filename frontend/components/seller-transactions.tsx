"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiClientError, getSellerTransactions } from "@/lib/api";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export function SellerTransactions() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getSellerTransactions>>["items"]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getSellerTransactions().then(({ items: loaded }) => setItems(loaded)).catch((requestError: unknown) => setError(requestError instanceof ApiClientError ? requestError.message : "Unable to load transactions.")); }, []);
  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><Link href="/seller" className="text-sm font-semibold text-brand-600">← Seller dashboard</Link><h1 className="mt-4 text-3xl font-bold">Transactions</h1><p className="mt-2 text-slate-600">Accounting estimates for your seller allocations; no payouts have been made.</p>{error && <p role="alert" className="mt-6 rounded bg-red-50 p-3 text-red-700">{error}</p>}{items.length ? <div className="mt-8 overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-4">Order</th><th className="p-4">Payment</th><th className="p-4">Gross</th><th className="p-4">Platform fee</th><th className="p-4">Estimated net</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 font-medium">{item.orderId}</td><td className="p-4 capitalize">{item.paymentStatus.toLowerCase()}</td><td className="p-4">{money(item.grossAmount, item.currency)}</td><td className="p-4">{money(item.platformFeeAmount, item.currency)} ({item.feeRate}%)</td><td className="p-4 font-semibold">{money(item.sellerNetAmount, item.currency)}</td></tr>)}</tbody></table></div> : !error && <p className="mt-8 text-slate-600">No seller allocations yet.</p>}</section>;
}
