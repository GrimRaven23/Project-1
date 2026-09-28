"use client";

import React, { useState } from "react";
import { ExpertRequest } from "@/core/domain/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { Shield, Lock, Send, CheckCircle2 } from "lucide-react";

interface ExpertTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ExpertRequest;
  onSaveResponse: (
    requestId: string,
    response: {
      clientSafeRecommendation: string;
      internalNotes: string;
      suggestedBomItems: any[];
      technicalRisks: string[];
    }
  ) => void;
}

export const ExpertTriageModal: React.FC<ExpertTriageModalProps> = ({
  isOpen,
  onClose,
  request,
  onSaveResponse
}) => {
  const { currentUser, hasPermission } = useAuth();
  const { t } = useI18n();

  const [clientSafeRecommendation, setClientSafeRecommendation] = useState(
    request.response?.clientSafeRecommendation || ""
  );
  const [internalNotes, setInternalNotes] = useState(request.response?.internalNotes || "");
  const [technicalRisks, setTechnicalRisks] = useState<string>(
    (request.response?.technicalRisks || []).join("\n")
  );

  const canEditExpertNotes = hasPermission("expert_requests:respond");
  const canViewConfidential = hasPermission("expert_notes:view_confidential");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveResponse(request.id, {
      clientSafeRecommendation,
      internalNotes,
      suggestedBomItems: request.response?.suggestedBomItems || [],
      technicalRisks: technicalRisks.split("\n").filter((r) => r.trim().length > 0)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Specialist Review: ${request.questionTitle}`}
      description={`Case ${request.caseNumber} • ${request.customerName} • Domain: ${request.domain}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Request Overview */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge domain={request.domain}>{request.domain}</Badge>
              <Badge priority={request.priority}>{request.priority} PRIORITY</Badge>
            </div>
            <span className="text-[11px] text-slate-500">
              Requested by {request.requestedByUserName}
            </span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
            {request.questionDetail}
          </p>
        </div>

        {/* Expert Response Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client-Safe Recommendation */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {t.expert.clientSafeSummary}
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              This summary will be visible to commercial agents and included in technical offer drafts.
            </p>
            <textarea
              rows={3}
              required
              disabled={!canEditExpertNotes}
              value={clientSafeRecommendation}
              onChange={(e) => setClientSafeRecommendation(e.target.value)}
              placeholder="Provide clear, authoritative technical recommendations..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Internal Confidential Notes (SECURITY_SENSITIVE) */}
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 p-4">
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-rose-900 dark:text-rose-300">
                <Lock className="w-3.5 h-3.5" />
                <span>{t.expert.internalConfidentialNotes}</span>
                <span className="bg-rose-200 text-rose-800 text-[10px] font-mono px-1 rounded">
                  SECURITY_SENSITIVE
                </span>
              </label>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mb-2">
              {t.expert.restrictedNotice}
            </p>
            {canViewConfidential ? (
              <textarea
                rows={3}
                disabled={!canEditExpertNotes}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Internal engineering calculations, threat models, or unmasked topology details..."
                className="w-full rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 font-mono text-slate-800 dark:text-slate-200"
              />
            ) : (
              <div className="bg-rose-100/70 dark:bg-rose-900/50 p-3 rounded-lg text-xs font-mono text-rose-800 dark:text-rose-200">
                [REDACTED: RESTRICTED TO DOMAIN SPECIALISTS & AUDITORS]
              </div>
            )}
          </div>

          {/* Technical Risks */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {t.expert.technicalRisks} (One per line)
            </label>
            <textarea
              rows={2}
              disabled={!canEditExpertNotes}
              value={technicalRisks}
              onChange={(e) => setTechnicalRisks(e.target.value)}
              placeholder="e.g. Certificate distribution required across Windows fleet..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            {canEditExpertNotes && (
              <Button type="submit" variant="telecom">
                <CheckCircle2 className="w-4 h-4" />
                {t.expert.submitRecommendation}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};
