"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { apiGet, ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { History, Search, AlertCircle, Loader2 } from "lucide-react";

interface AuditLogRow {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  resource: string;
  resourceId: string;
  caseNumber?: string;
  correlationId: string;
  timestamp: string;
}

export default function AuditPage() {
  const { t, language } = useI18n();
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canView = hasPermission("audit:view");

  const loadLogs = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = `?limit=500${query ? `&search=${encodeURIComponent(query)}` : ""}`;
      const res = await apiGet<{ data: AuditLogRow[] }>(`/api/audit${qs}`);
      setLogs(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    const handle = setTimeout(() => void loadLogs(search), 250);
    return () => clearTimeout(handle);
  }, [search, loadLogs, canView]);

  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-sm text-slate-500">
        Your role does not have permission to view the audit trail.
      </div>
    );
  }

  // Client-side filter on the already-scoped result set (server also supports
  // an exact-match `search` param, but local filtering keeps typing responsive).
  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      (l.caseNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          {t.navigation.auditLog}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-proof immutable audit trail complying with OWASP ASVS V1.15 and enterprise compliance controls.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit events by action, actor, or case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading audit trail…
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No audit events found.</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Resource / Case</th>
                <th className="py-3 px-4">Correlation ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {formatDate(log.timestamp, language)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {log.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {log.actorName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{log.caseNumber || log.resource}</td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{log.correlationId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
