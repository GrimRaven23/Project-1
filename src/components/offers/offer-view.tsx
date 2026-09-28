"use client";

import React from "react";
import { OfferDraft, SolutionCase } from "@/core/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, CheckCircle2, ShieldCheck, Download, AlertCircle } from "lucide-react";

interface OfferViewProps {
  solutionCase: SolutionCase;
  onApproveOffer: (offerId: string) => void;
  onGenerateOffer: () => void;
}

export const OfferView: React.FC<OfferViewProps> = ({
  solutionCase,
  onApproveOffer,
  onGenerateOffer
}) => {
  const { t, language } = useI18n();
  const { hasPermission, currentUser } = useAuth();
  const offer = solutionCase.offers?.[0];

  const canApprove = hasPermission("offers:approve");

  if (!offer) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
        <FileText className="w-10 h-10 text-blue-500 mx-auto mb-3 opacity-60" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
          No Commercial Offer Generated Yet
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          Once technical requirements are qualified and BOM items are confirmed, compile the structured commercial proposal draft.
        </p>
        <Button onClick={onGenerateOffer} variant="telecom" size="md">
          <FileText className="w-4 h-4" /> Generate Commercial Offer Draft
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Proposal Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                {offer.status}
              </span>
              <span className="text-xs font-mono text-slate-400">Offer v{offer.version}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{offer.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => alert("Generating formatted PDF proposal summary...")}
            >
              <Download className="w-4 h-4" /> {t.offer.downloadProposal}
            </Button>
            {offer.status === "DRAFT" && canApprove && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onApproveOffer(offer.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> {t.offer.approveOffer}
              </Button>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.offer.executiveSummary}
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {offer.summaryExecutive}
          </p>
        </div>

        {/* Financial Recapitulation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Total Setup & Capex</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(offer.totalCapexEur, language)}
            </p>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Total Monthly Opex</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {formatCurrency(offer.totalMonthlyOpexEur, language)} <span className="text-xs font-normal text-slate-500">/mo</span>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold text-slate-500">{t.offer.contractDuration}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {offer.contractTermMonths} Mois
            </p>
          </div>
        </div>

        {/* Technical Assumptions */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.offer.technicalAssumptions}
          </h4>
          <ul className="space-y-1.5">
            {offer.technicalAssumptions.map((assumption, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800"
              >
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Manager Signoff Status */}
        {offer.approvalDate ? (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Offer Officially Approved by Commercial Management
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Approved on {formatDate(offer.approvalDate, language)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Awaiting Commercial Manager Signoff
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                {canApprove
                  ? "As Commercial Manager, you can approve this offer using the button above."
                  : "Switch to Commercial Manager persona to authorize this offer."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
