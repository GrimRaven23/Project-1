"use client";

import React from "react";
import { SolutionCase, QualificationResult } from "@/core/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  Send
} from "lucide-react";

interface QualificationViewProps {
  solutionCase: SolutionCase;
  onRunQualification: () => void;
  onEscalateExpert: (domain: string) => void;
  onGenerateBom: () => void;
  isRunning?: boolean;
}

export const QualificationView: React.FC<QualificationViewProps> = ({
  solutionCase,
  onRunQualification,
  onEscalateExpert,
  onGenerateBom,
  isRunning
}) => {
  const { t, language } = useI18n();
  const qResult = solutionCase.qualificationResult;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "REQUIRES_EXPERT_VALIDATION":
        return <HelpCircle className="w-4 h-4 text-amber-600 animate-pulse" />;
      case "REPLACEMENT_RECOMMENDED":
      case "RENEWAL_REQUIRED":
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      case "INCOMPATIBLE":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">{t.qualification.deterministicEngine}</h3>
          </div>
          <p className="text-xs text-blue-200 max-w-2xl">
            {qResult
              ? qResult.summary[language]
              : "Execute the deterministic rules engine to evaluate catalog eligibility, hardware replacement flags, and specialist expert routing."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={onRunQualification}
            disabled={isRunning}
            variant="primary"
            size="md"
            className="bg-white text-blue-950 hover:bg-blue-50 font-bold shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
            {t.case.runQualification}
          </Button>
          {qResult && (
            <Button
              onClick={onGenerateBom}
              variant="outline"
              size="md"
              className="border-blue-400/50 text-white hover:bg-blue-800/50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t.case.generateBom}
            </Button>
          )}
        </div>
      </div>

      {/* Missing Information Alerts */}
      {qResult?.missingInformationFlags && qResult.missingInformationFlags.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Missing Information Required for Full Qualification</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 dark:text-amber-200">
            {qResult.missingInformationFlags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Qualification Results Grid */}
      {qResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qResult.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge domain={item.domain}>{item.domain.replace("_", " ")}</Badge>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.ruleCode}
                    </span>
                  </div>
                  <Badge status={item.status}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(item.status)}
                      <span>{item.status.replace(/_/g, " ")}</span>
                    </span>
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {item.title}
                </h4>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mb-3">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">{t.qualification.explanation}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.explanation[language]}
                  </p>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    {t.qualification.suggestedAction}
                  </p>
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    {item.suggestedAction[language]}
                  </p>
                </div>
              </div>

              {item.requiresExpertEscalation && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Specialist Authority Required
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEscalateExpert(item.domain)}
                    className="text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Escalate to {item.domain} Expert
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            Deterministic Engine Ready
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Click &quot;Run Qualification Engine&quot; to evaluate customer answers and hardware baseline against active telecom catalog rules.
          </p>
          <Button onClick={onRunQualification} variant="telecom" size="md">
            <RefreshCw className="w-4 h-4" /> Run Qualification Now
          </Button>
        </div>
      )}
    </div>
  );
};
