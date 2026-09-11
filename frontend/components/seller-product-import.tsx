"use client";

import { useState } from "react";
import { ApiClientError, importSellerProducts, previewSellerProductImport, type SellerImportPreview } from "@/lib/api";

const format = "title,description,brand,category,price,currency,stock,sku,imageUrls";

export function SellerProductImport() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<SellerImportPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setError(null); setMessage(null); setPreview(null);
    try { setCsv(await file.text()); } catch { setError("Unable to read that CSV file."); }
  };
  const previewFile = async () => {
    if (!csv) { setError("Choose a CSV file first."); return; }
    setBusy(true); setError(null); setMessage(null);
    try { setPreview(await previewSellerProductImport(csv)); } catch (e) { setError(e instanceof ApiClientError ? e.message : "Unable to preview the CSV."); } finally { setBusy(false); }
  };
  const importFile = async () => {
    if (!preview?.valid || !window.confirm(`Import ${preview.rowCount} draft products?`)) return;
    setBusy(true); setError(null);
    try { const result = await importSellerProducts(csv); setMessage(`${result.importedCount} draft products imported.`); setPreview(null); setCsv(""); setFileName(""); } catch (e) { setError(e instanceof ApiClientError ? e.message : "Unable to import the CSV."); } finally { setBusy(false); }
  };
  return <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Bulk import products</h2><p className="mt-1 text-sm text-slate-600">Simple products only; each row creates a draft with one SKU-backed variant. Variants and attributes can be added from the product editor.</p><p className="mt-2 break-all rounded bg-slate-50 p-2 font-mono text-xs text-slate-600">{format}</p><input className="mt-4 block w-full text-sm" type="file" accept=".csv,text/csv" onChange={chooseFile} />{fileName && <p className="mt-2 text-sm text-slate-600">{fileName}</p>}{error && <p role="alert" className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<button type="button" disabled={busy || !csv} onClick={previewFile} className="mt-4 rounded bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Working…" : "Preview CSV"}</button>{preview && <div className="mt-4 space-y-3 text-sm"><p className={preview.valid ? "text-emerald-700" : "text-red-700"}>{preview.valid ? `${preview.rowCount} rows ready to import.` : `${preview.errors.length} validation issue(s) found.`}</p>{preview.errors.length > 0 && <ul className="max-h-40 list-disc overflow-auto rounded bg-red-50 p-3 pl-7 text-red-700">{preview.errors.map((item, index) => <li key={`${item.row}-${item.field ?? "row"}-${index}`}>Row {item.row}{item.field ? ` (${item.field})` : ""}: {item.message}</li>)}</ul>}{preview.valid && <button type="button" disabled={busy} onClick={importFile} className="rounded bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Import drafts</button>}</div>}</div>;
}
