"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DatabaseRepository } from "@/core/storage/database";
import { SolutionCase } from "@/core/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { formatDate } from "@/lib/utils";
import {
  FolderKanban,
  PlusCircle,
  Search,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function CasesListPage() {
  const { t, language } = useI18n();
  const [cases, setCases] = useState<SolutionCase[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    setCases(DatabaseRepository.getCases());
  }, []);

  const filteredCases = cases.filter((sc) => {
    const matchesSearch =
      sc.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      sc.title.toLowerCase().includes(search.toLowerCase()) ||
      (sc.customer?.companyName || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || sc.lifecycleState === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            {t.navigation.cases}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer solution cases, qualification lifecycles, and expert reviews.
          </p>
        </div>
        <Link href="/cases/new">
          <Button variant="telecom" size="md">
            <PlusCircle className="w-4 h-4" /> {t.navigation.newCase}
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "INTAKE_IN_PROGRESS", "EXPERT_REVIEW_IN_PROGRESS", "QUALIFICATION_COMPLETE", "APPROVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCases.map((sc) => (
          <div
            key={sc.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                  {sc.caseNumber}
                </span>
                <Badge status={sc.lifecycleState}>{sc.lifecycleState.replace(/_/g, " ")}</Badge>
                <Badge priority={sc.priority}>{sc.priority}</Badge>
                <span className="text-[10px] font-mono text-slate-400">v{sc.version}</span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5" /> Updated: {formatDate(sc.updatedAt, language)}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{sc.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" /> {sc.customer?.companyName}
                  </span>
                  <span>•</span>
                  <span>{sc.sites.length} Sites ({sc.sites.map((s) => s.city).join(", ")})</span>
                  <span>•</span>
                  <span>Owner: {sc.assignedCommercialName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {sc.participatingExpertDomains.map((dom) => (
                    <Badge key={dom} domain={dom}>
                      {dom.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
                <Link href={`/cases/${sc.id}`}>
                  <Button variant="primary" size="sm">
                    {t.common.viewDetails} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
