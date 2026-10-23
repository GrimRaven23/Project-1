"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SolutionCase, ExpertRequest } from "@/core/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FolderKanban,
  Headphones,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Building2,
  AlertTriangle
} from "lucide-react";

export default function DashboardPage() {
  const { t, language } = useI18n();
  const { isAuthenticated } = useAuth();
  const [cases, setCases] = useState<SolutionCase[]>([]);
  const [expertRequests, setExpertRequests] = useState<ExpertRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until the session is resolved so we don't fire an unauthenticated
    // request on first paint (which would 401 and render an empty dashboard).
    if (!isAuthenticated) return;
    let cancelled = false;

    async function loadData() {
      try {
        // Same-origin fetches send the HttpOnly session cookie automatically.
        const [casesRes, expertsRes] = await Promise.all([
          fetch("/api/cases", { credentials: "same-origin" }),
          fetch("/api/experts", { credentials: "same-origin" })
        ]);

        if (cancelled) return;
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.data || []);
        }
        if (expertsRes.ok) {
          const expertsData = await expertsRes.json();
          setExpertRequests(expertsData.data || []);
        }
      } catch {
        // Graceful degradation — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const awaitingExpertCount = cases.filter((c) => c.lifecycleState === "EXPERT_REVIEW_REQUIRED" || c.lifecycleState === "EXPERT_REVIEW_IN_PROGRESS").length;
  const qualifiedCount = cases.filter((c) => c.lifecycleState === "QUALIFICATION_COMPLETE" || c.lifecycleState === "SOLUTION_READY" || c.lifecycleState === "OFFER_PREPARATION" || c.lifecycleState === "APPROVED").length;
  const approvedOfferCount = cases.filter((c) => c.lifecycleState === "APPROVED" || c.lifecycleState === "WON").length;

  const totalPipelineCapex = cases.reduce((acc, c) => {
    const offer = c.offers?.[0];
    return acc + (offer ? offer.totalCapexEur : 0);
  }, 0);

  const totalPipelineOpex = cases.reduce((acc, c) => {
    const offer = c.offers?.[0];
    return acc + (offer ? offer.totalMonthlyOpexEur : 0);
  }, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" /> B2B Telecom Presales Intelligence
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {t.common.appName}
            </h1>
            <p className="text-xs md:text-sm text-blue-200 max-w-2xl leading-relaxed">
              Accelerating commercial deal qualification while preserving specialist engineering authority for complex network, telephony, and cybersecurity solutions.
            </p>
          </div>
          <Link href="/cases/new">
            <Button variant="primary" size="lg" className="bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-500/30">
              <PlusCircle className="w-5 h-5" /> {t.navigation.newCase}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">{t.dashboard.activeCases}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{cases.length}</p>
            <p className="text-[11px] text-blue-600 font-medium mt-1">In qualification pipeline</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">{t.dashboard.awaitingExperts}</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">{awaitingExpertCount}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1">Specialist reviews active</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700">
            <Headphones className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">{t.dashboard.qualifiedSolutions}</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{qualifiedCount}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">Ready for proposal</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400">{t.dashboard.monthlyRecurring}</p>
            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 mt-1">
              {formatCurrency(totalPipelineOpex, language)}
            </p>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium mt-1">
              Total Capex: {formatCurrency(totalPipelineCapex, language)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Cases & Specialist Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.dashboard.recentCases}
            </h3>
            <Link href="/cases" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No cases yet. Create your first solution case.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cases.map((sc) => (
                <div key={sc.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{sc.caseNumber}</span>
                      <Badge status={sc.lifecycleState}>{sc.lifecycleState.replace(/_/g, " ")}</Badge>
                      <Badge priority={sc.priority}>{sc.priority}</Badge>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{sc.title}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" /> {sc.customer?.companyName} • {sc.sites?.length || 0} Sites • Owner: {sc.assignedCommercialName}
                    </p>
                  </div>
                  <Link href={`/cases/${sc.id}`}>
                    <Button size="sm" variant="outline">
                      {t.common.viewDetails}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Specialist Escalations Queue */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-amber-500" />
              {t.dashboard.expertTriageSummary}
            </h3>
            <Link href="/experts" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Triage Queue
            </Link>
          </div>

          <div className="space-y-3">
            {expertRequests.map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge domain={req.domain}>{req.domain}</Badge>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    {req.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {req.questionTitle}
                </p>
                <p className="text-[11px] text-slate-500">
                  Customer: {req.customerName}
                </p>
                <Link href={`/cases/${req.caseId}`}>
                  <Button size="sm" variant="outline" className="w-full mt-1 border-amber-300 hover:bg-amber-100/50">
                    Open Case Review
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
