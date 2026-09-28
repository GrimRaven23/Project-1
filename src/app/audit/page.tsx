"use client";

import React, { useState } from "react";
import { AuditService } from "@/core/audit/audit-logger";
import { useI18n } from "@/lib/i18n/context";
import { formatDate } from "@/lib/utils";
import { History, Shield, Search, Lock } from "lucide-react";

export default function AuditPage() {
  const { t, language } = useI18n();
  const [search, setSearch] = useState("");
  const allLogs = AuditService.getLogs({ limit: 50 });

  const filteredLogs = allLogs.filter((l) =>
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

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
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
      </div>
    </div>
  );
}
