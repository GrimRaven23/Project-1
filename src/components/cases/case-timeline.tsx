"use client";

import React from "react";
import { AuditLogEntry } from "@/core/domain/types";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { Activity, UserCheck, Shield, FileText, CheckCircle2 } from "lucide-react";

export const CaseTimeline: React.FC<{ logs: AuditLogEntry[] }> = ({ logs }) => {
  const { language } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Cryptographic Case Activity Timeline & Audit Trail
        </h4>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          Immutable ASVS V1.15
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {logs.map((entry) => (
          <div key={entry.id} className="relative group">
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 flex items-center justify-center shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  {entry.action.replace(/_/g, " ")}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDate(entry.timestamp, language)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Executed by <strong className="text-slate-900 dark:text-slate-100">{entry.actorName}</strong> ({entry.actorRole.replace("_", " ")})
              </p>
              {entry.newState && (
                <div className="mt-2 p-2 rounded bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  State: {JSON.stringify(entry.newState)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
