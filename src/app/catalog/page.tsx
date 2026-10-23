"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CatalogProduct } from "@/core/catalog/catalog-service";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { apiGet, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { BookOpen, Search, AlertCircle, Loader2 } from "lucide-react";

const DOMAINS = ["ALL", "TELEPHONY", "NETWORK_SDWAN", "WIFI", "CYBERSECURITY_FIREWALL"] as const;

export default function CatalogPage() {
  const { t, language } = useI18n();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<(typeof DOMAINS)[number]>("ALL");

  const loadCatalog = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (selectedDomain !== "ALL") params.set("domain", selectedDomain);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await apiGet<{ data: CatalogProduct[] }>(`/api/catalog${qs}`);
      setProducts(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [selectedDomain]);

  useEffect(() => {
    const handle = setTimeout(() => void loadCatalog(search), 250);
    return () => clearTimeout(handle);
  }, [search, loadCatalog]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          {t.navigation.catalog}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configurable telecom products, connectivity services, pricing tiers, and rule associations.
        </p>
      </div>

      {/* Search & Domain Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog by SKU or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDomain === d
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {d.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading catalog…
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
          No products match your search.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge domain={prod.domain}>{prod.domain.replace("_", " ")}</Badge>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  v{prod.version} • {prod.lifecycleState}
                </span>
              </div>

              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {prod.code}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 mb-1.5">
                {prod.name[language]}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{prod.description[language]}</p>

              <div className="flex flex-wrap gap-1 mt-3">
                {prod.compatibilityTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Capex</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(prod.capexPriceEur, language)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Monthly Opex</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(prod.opexMonthlyEur, language)}/mo
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
