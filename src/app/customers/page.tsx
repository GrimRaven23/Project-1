"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/auth-context";
import { apiGet, apiSend, ApiError } from "@/lib/api/client";
import { Customer } from "@/core/domain/types";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  X,
  Search,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";

const SEGMENTS = ["SMB", "PME", "PMI", "ENTERPRISE", "PUBLIC_SECTOR"] as const;

export default function CustomersPage() {
  const { t, language } = useI18n();
  const { hasPermission } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    sirenOrVat: "",
    industrySegment: "PME" as (typeof SEGMENTS)[number],
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactPosition: ""
  });

  const canCreate = hasPermission("customers:create");

  const loadCustomers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await apiGet<{ data: Customer[] }>(`/api/customers${qs}`);
      setCustomers(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => void loadCustomers(search), 250);
    return () => clearTimeout(handle);
  }, [search, loadCustomers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await apiSend("/api/customers", "POST", {
        companyName: form.companyName,
        sirenOrVat: form.sirenOrVat,
        industrySegment: form.industrySegment,
        primaryContact: {
          name: form.contactName,
          email: form.contactEmail,
          phone: form.contactPhone,
          position: form.contactPosition
        }
      });
      setShowCreate(false);
      setForm({
        companyName: "",
        sirenOrVat: "",
        industrySegment: "PME",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        contactPosition: ""
      });
      await loadCustomers(search);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create customer");
    } finally {
      setCreating(false);
    }
  };

  const field =
    "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const label = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {t.navigation.customers}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise accounts, technical contacts, sites, and account manager assignments.
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Customer
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, SIREN/VAT or contact…"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading customers…
        </div>
      ) : customers.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
          {search ? "No customers match your search." : "No customers yet. Create your first account to start a case."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                    {c.industrySegment}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{c.sirenOrVat}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{c.companyName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Commercial Owner: {c.accountManagerName}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-slate-100">{c.primaryContact?.name}</p>
                <p className="text-[11px] text-slate-500">{c.primaryContact?.position}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">{c.primaryContact?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{c.primaryContact?.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Building2 className="w-3.5 h-3.5" /> Account ID: <span className="font-mono">{c.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">New Customer Account</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className={label}>Company Name *</label>
                <input
                  required
                  className={field}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="AeroTech Solutions"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>SIREN / VAT *</label>
                  <input
                    required
                    className={field}
                    value={form.sirenOrVat}
                    onChange={(e) => setForm({ ...form, sirenOrVat: e.target.value })}
                    placeholder="FR12345678901"
                  />
                </div>
                <div>
                  <label className={label}>Segment</label>
                  <select
                    className={field}
                    value={form.industrySegment}
                    onChange={(e) =>
                      setForm({ ...form, industrySegment: e.target.value as (typeof SEGMENTS)[number] })
                    }
                  >
                    {SEGMENTS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Primary Contact *</p>
                <div className="space-y-3">
                  <input
                    required
                    className={field}
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="Full name"
                  />
                  <input
                    required
                    type="email"
                    className={field}
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="name@company.com"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      className={field}
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="+33 1 23 45 67 89"
                    />
                    <input
                      required
                      className={field}
                      value={form.contactPosition}
                      onChange={(e) => setForm({ ...form, contactPosition: e.target.value })}
                      placeholder="DSI / CTO"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Customer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
