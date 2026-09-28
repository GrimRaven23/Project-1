"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DatabaseRepository } from "@/core/storage/database";
import { ExpertRequest } from "@/core/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpertTriageModal } from "@/components/experts/expert-triage-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { formatDate } from "@/lib/utils";
import { Headphones, Shield, Phone, Globe, Lock, ArrowRight } from "lucide-react";

export default function ExpertsTriagePage() {
  const { t, language } = useI18n();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<ExpertRequest[]>([]);
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [activeModalRequest, setActiveModalRequest] = useState<ExpertRequest | null>(null);

  useEffect(() => {
    setRequests(DatabaseRepository.getAllExpertRequests());
  }, []);

  const filtered =
    domainFilter === "ALL" ? requests : requests.filter((r) => r.domain === domainFilter);

  const handleSaveResponse = (requestId: string, response: any) => {
    const foundCase = DatabaseRepository.getCases().find((c) =>
      c.expertRequests.some((r) => r.id === requestId)
    );
    if (foundCase) {
      const updatedRequests = foundCase.expertRequests.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: "COMPLETED" as const,
            response: {
              ...response,
              respondedAt: new Date().toISOString(),
              expertUserId: currentUser.id,
              expertUserName: currentUser.name
            }
          };
        }
        return r;
      });

      DatabaseRepository.saveCase(
        {
          ...foundCase,
          expertRequests: updatedRequests
        },
        currentUser
      );
      setRequests(DatabaseRepository.getAllExpertRequests());
    }
  };

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
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {["ALL", "CYBERSECURITY_FIREWALL", "NETWORK_SDWAN", "TELEPHONY", "SOLUTIONS_ARCHITECT"].map((dom) => (
          <button
            key={dom}
            onClick={() => setDomainFilter(dom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              domainFilter === dom
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {dom.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
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
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${req.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {req.status}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Requested on {formatDate(req.createdAt, language)}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.questionTitle}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{req.questionDetail}</p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Customer: <strong>{req.customerName}</strong> ({req.caseNumber}) • Requested by {req.requestedByUserName}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="telecom"
                  onClick={() => setActiveModalRequest(req)}
                >
                  <Lock className="w-3.5 h-3.5" /> Review & Add Notes
                </Button>
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
