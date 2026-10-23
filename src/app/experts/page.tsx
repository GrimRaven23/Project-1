"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExpertRequest } from "@/core/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpertTriageModal } from "@/components/experts/expert-triage-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { apiGet, apiSend, ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Headphones, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const DOMAINS = [
  "ALL",
  "CYBERSECURITY_FIREWALL",
  "NETWORK_SDWAN",
  "WIFI",
  "TELEPHONY",
  "SOLUTIONS_ARCHITECT"
] as const;

export default function ExpertsTriagePage() {
  const { t, language } = useI18n();
  const { hasPermission } = useAuth();

  const [requests, setRequests] = useState<ExpertRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<(typeof DOMAINS)[number]>("ALL");
  const [activeModalRequest, setActiveModalRequest] = useState<ExpertRequest | null>(null);

  const canViewQueue = hasPermission("expert_requests:view_queue");
  const canRespond = hasPermission("expert_requests:respond");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ data: ExpertRequest[] }>("/api/experts");
      setRequests(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load the expert queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  // The API already scopes the queue by role/domain; this is display-only.
  const filtered =
    domainFilter === "ALL" ? requests : requests.filter((r) => r.domain === domainFilter);

  const handleSaveResponse = async (requestId: string, response: any) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    try {
      await apiSend(`/api/cases/${req.caseId}/expert-request`, "PUT", {
        requestId,
        status: "COMPLETED",
        clientSafeRecommendation: response.clientSafeRecommendation,
        internalNotes: response.internalNotes,
        technicalRisks: response.technicalRisks,
        suggestedBomItems: response.suggestedBomItems,
        technicalAlternatives: response.technicalAlternatives
      });
      setActiveModalRequest(null);
      await loadRequests();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save the expert response");
    }
  };

  if (!canViewQueue) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-sm text-slate-500">
        Your role does not have access to the specialist triage queue.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Headphones className="w-5 h-5 text-amber-500" />
          {t.expert.triageQueue}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Specialist engineering ticket queue for high-impact, non-deterministic presales escalations.
        </p>
      </div>

      {/* Domain Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {DOMAINS.map((dom) => (
          <button
            key={dom}
            onClick={() => setDomainFilter(dom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              domainFilter === dom
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {dom.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading expert queue…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
          No specialist requests in this queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 hover:border-amber-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Badge domain={req.domain}>{req.domain}</Badge>
                  <Badge priority={req.priority}>{req.priority} PRIORITY</Badge>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      req.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Requested on {formatDate(req.createdAt, language)}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {req.questionTitle}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{req.questionDetail}</p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Customer: <strong>{req.customerName}</strong> ({req.caseNumber}) • Requested by{" "}
                    {req.requestedByUserName}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canRespond && (
                    <Button size="sm" variant="telecom" onClick={() => setActiveModalRequest(req)}>
                      <Lock className="w-3.5 h-3.5" /> Review & Add Notes
                    </Button>
                  )}
                  <Link href={`/cases/${req.caseId}`}>
                    <Button size="sm" variant="outline">
                      View Case <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeModalRequest && (
        <ExpertTriageModal
          isOpen={true}
          onClose={() => setActiveModalRequest(null)}
          request={activeModalRequest}
          onSaveResponse={handleSaveResponse}
        />
      )}
    </div>
  );
}
