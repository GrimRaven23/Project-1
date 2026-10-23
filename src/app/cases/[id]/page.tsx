"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SolutionCase, DynamicQuestionnaireAnswer, ExpertRequest, AuditLogEntry } from "@/core/domain/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionnaireForm } from "@/components/forms/questionnaire-form";
import { QualificationView } from "@/components/qualification/qualification-view";
import { ExpertTriageModal } from "@/components/experts/expert-triage-modal";
import { BomTable } from "@/components/bom/bom-table";
import { OfferView } from "@/components/offers/offer-view";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { apiGet, apiSend, ApiError } from "@/lib/api/client";
import {
  ArrowLeft,
  Building2,
  Phone,
  Shield,
  Sparkles,
  Headphones,
  FileSpreadsheet,
  FileText,
  History,
  AlertCircle,
  Loader2,
  Plus
} from "lucide-react";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;
  const { t, language } = useI18n();
  const { hasPermission } = useAuth();

  const [solutionCase, setSolutionCase] = useState<SolutionCase | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("qualification");
  const [selectedExpertRequest, setSelectedExpertRequest] = useState<ExpertRequest | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  const canRunQualification = hasPermission("qualification:run");
  const canEditBom = hasPermission("bom:edit");
  const canCreateOffer = hasPermission("offers:create");
  const canEscalate = hasPermission("expert_requests:create");
  const canViewAudit = hasPermission("audit:view");

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiGet<{ data: SolutionCase }>(`/api/cases/${caseId}`);
      setSolutionCase(res.data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const loadAudit = useCallback(async () => {
    if (!caseId || !canViewAudit) return;
    try {
      const res = await apiGet<{ data: AuditLogEntry[] }>(
        `/api/audit?caseId=${encodeURIComponent(caseId)}&limit=200`
      );
      setAuditLogs(res.data || []);
    } catch {
      // Audit view is supplementary — the case still renders without it.
    }
  }, [caseId, canViewAudit]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  /** Apply a server response and surface any error inline. */
  const applyUpdate = async (fn: () => Promise<{ data?: unknown; updatedCase?: SolutionCase }>) => {
    setActionError(null);
    try {
      const res = await fn();
      if (res.updatedCase) setSolutionCase(res.updatedCase);
      else await loadCase();
      await loadAudit();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed");
    }
  };

  const handleSaveQuestionnaire = async (updatedQ: DynamicQuestionnaireAnswer) => {
    if (!solutionCase) return;
    await applyUpdate(() =>
      apiSend<{ updatedCase: SolutionCase }>(`/api/cases/${solutionCase.id}`, "PUT", {
        questionnaire: updatedQ
      })
    );
  };

  const handleRunQualification = async () => {
    if (!solutionCase) return;
    setIsQualifying(true);
    await applyUpdate(() =>
      apiSend<{ data: unknown; updatedLifecycleState: string }>(
        `/api/cases/${solutionCase.id}/qualify`,
        "POST"
      )
    );
    setIsQualifying(false);
  };

  const handleGenerateBom = async () => {
    if (!solutionCase) return;
    await applyUpdate(() =>
      apiSend<{ updatedCase: SolutionCase }>(`/api/cases/${solutionCase.id}/bom`, "POST")
    );
    setActiveTab("bom");
  };

  const handleEscalateExpert = async (domain: string) => {
    if (!solutionCase) return;
    await applyUpdate(() =>
      apiSend<{ updatedCase: SolutionCase }>(`/api/cases/${solutionCase.id}/expert-request`, "POST", {
        domain,
        questionTitle: `${domain.replace(/_/g, " ")} Architecture & Throughput Review`,
        questionDetail: `Specialist review requested for case ${solutionCase.caseNumber}. Please validate capacity constraints, topology and provide BOM line items.`,
        priority: "HIGH"
      })
    );
    setActiveTab("experts");
  };

  const handleSaveExpertResponse = async (requestId: string, response: any) => {
    if (!solutionCase) return;
    await applyUpdate(() =>
      apiSend<{ updatedCase: SolutionCase }>(`/api/cases/${solutionCase.id}/expert-request`, "PUT", {
        requestId,
        status: "COMPLETED",
        clientSafeRecommendation: response.clientSafeRecommendation,
        internalNotes: response.internalNotes,
        technicalRisks: response.technicalRisks,
        suggestedBomItems: response.suggestedBomItems,
        technicalAlternatives: response.technicalAlternatives
      })
    );
  };

  const handleApproveOffer = async (offerId: string) => {
    if (!solutionCase) return;
    await applyUpdate(() =>
      apiSend<{ updatedCase: SolutionCase }>(`/api/cases/${solutionCase.id}/offer`, "PUT", {
        offerId,
        status: "APPROVED"
      })
    );
  };

  const handleGenerateOfferDraft = async () => {
    if (!solutionCase) return;
    await applyUpdate(() =>
      apiSend<{ updatedCase: SolutionCase }>(`/api/cases/${solutionCase.id}/offer`, "POST", {
        title: `Proposition Commerciale & Technique Globale - ${solutionCase.customer?.companyName}`,
        contractTermMonths: 36
      })
    );
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading case…
      </div>
    );
  }

  if (loadError || !solutionCase) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-rose-600 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> {loadError || "Case not found."}
        </p>
        <Link href="/cases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" /> Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  const sites = solutionCase.sites || [];
  const existingAssets = solutionCase.existingAssets || [];
  const expertRequests = solutionCase.expertRequests || [];
  const bomItems = solutionCase.bomItems || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back link & Top Meta */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cases
        </Link>
        <div className="flex items-center gap-2">
          <Badge status={solutionCase.lifecycleState}>
            {solutionCase.lifecycleState.replace(/_/g, " ")}
          </Badge>
          <Badge priority={solutionCase.priority}>{solutionCase.priority} PRIORITY</Badge>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Case Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                {solutionCase.caseNumber}
              </span>
              <span className="text-xs text-slate-400">• v{solutionCase.version}</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {solutionCase.title}
            </h1>
          </div>

          {canRunQualification && (
            <div className="flex items-center gap-3">
              <Button onClick={handleRunQualification} disabled={isQualifying} variant="telecom" size="md">
                {isQualifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}{" "}
                Run Qualification
              </Button>
            </div>
          )}
        </div>

        {/* Customer & Sites Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Customer Account</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {solutionCase.customer?.companyName}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Commercial Owner</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {solutionCase.assignedCommercialName}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Sites Connected</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{sites.length} Sites</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Hardware Baseline</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {existingAssets.length} Assets
            </p>
          </div>
        </div>
      </div>

      {/* Main Multi-Domain Tabs */}
      <Tabs defaultValue="qualification" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-7 w-full p-1.5 h-auto">
          <TabsTrigger value="qualification" icon={<Sparkles className="w-4 h-4" />}>
            Qualification
          </TabsTrigger>
          <TabsTrigger value="requirements" icon={<Phone className="w-4 h-4" />}>
            Intake
          </TabsTrigger>
          <TabsTrigger value="assets" icon={<Shield className="w-4 h-4" />}>
            Assets & Sites
          </TabsTrigger>
          <TabsTrigger
            value="experts"
            icon={<Headphones className="w-4 h-4" />}
            badge={
              expertRequests.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                  {expertRequests.length}
                </span>
              ) : undefined
            }
          >
            Specialists
          </TabsTrigger>
          <TabsTrigger value="bom" icon={<FileSpreadsheet className="w-4 h-4" />}>
            BOM ({bomItems.length})
          </TabsTrigger>
          <TabsTrigger value="offers" icon={<FileText className="w-4 h-4" />}>
            Offer Draft
          </TabsTrigger>
          <TabsTrigger value="timeline" icon={<History className="w-4 h-4" />}>
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Qualification */}
        <TabsContent value="qualification">
          <QualificationView
            solutionCase={solutionCase}
            onRunQualification={handleRunQualification}
            onEscalateExpert={handleEscalateExpert}
            onGenerateBom={handleGenerateBom}
            isRunning={isQualifying}
          />
        </TabsContent>

        {/* Tab 2: Dynamic Questionnaire */}
        <TabsContent value="requirements">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Structured Customer Requirements Intake
            </h3>
            <QuestionnaireForm
              initialData={solutionCase.questionnaire}
              onSave={handleSaveQuestionnaire}
            />
          </div>
        </TabsContent>

        {/* Tab 3: Sites & Assets Delta */}
        <TabsContent value="assets">
          <div className="space-y-6">
            {/* Sites */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Customer Sites & Topography ({sites.length})
              </h3>
              {sites.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No sites attached to this case. Sites drive Wi-Fi density and fibre eligibility.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {site.siteName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {site.address}, {site.postalCode} {site.city}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                        <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                          {site.totalStaffCount} Staff
                        </span>
                        <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                          {site.areaSquareMeters} m²
                        </span>
                        <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                          {site.areas?.smallOfficesCount || 0} Offices
                        </span>
                        <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                          {site.areas?.meetingRoomsCount || 0} Meeting Rooms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Hardware Assets */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Existing Equipment Baseline & Delta State ({existingAssets.length})
              </h3>
              {existingAssets.length === 0 ? (
                <p className="text-xs text-slate-400">No existing equipment recorded for this case.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b text-slate-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Site</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Manufacturer / Model</th>
                        <th className="py-2.5 px-3">Install Year</th>
                        <th className="py-2.5 px-3">License Status</th>
                        <th className="py-2.5 px-3">Delta Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {existingAssets.map((asset) => (
                        <tr key={asset.id}>
                          <td className="py-2.5 px-3 font-semibold">{asset.siteName}</td>
                          <td className="py-2.5 px-3">
                            <Badge domain={asset.domain}>{asset.category}</Badge>
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {asset.manufacturer} {asset.model}
                          </td>
                          <td className="py-2.5 px-3">{asset.installYear}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                asset.licenseStatus === "EXPIRED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {asset.licenseStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-orange-600">
                              {asset.deltaStatus || "INVESTIGATE"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Specialist Expert Reviews */}
        <TabsContent value="experts">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Specialist Engineering Escalations ({expertRequests.length})
              </h3>
              {canEscalate && (
                <Button size="sm" variant="outline" onClick={() => handleEscalateExpert("NETWORK_SDWAN")}>
                  <Plus className="w-3.5 h-3.5" /> New Escalation
                </Button>
              )}
            </div>

            {expertRequests.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                No specialist escalations for this case yet.
              </div>
            ) : (
              expertRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge domain={req.domain}>{req.domain}</Badge>
                      <Badge priority={req.priority}>{req.priority} Priority</Badge>
                    </div>
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

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {req.questionTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{req.questionDetail}</p>

                  {req.response && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        Specialist Recommendation by {req.response.expertUserName}:
                      </p>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {req.response.clientSafeRecommendation}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSelectedExpertRequest(req)}>
                      Open Full Review & Confidential Notes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Bill of Materials */}
        <TabsContent value="bom">
          <div className="space-y-3">
            {canEditBom && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={handleGenerateBom}>
                  <Sparkles className="w-3.5 h-3.5" /> Regenerate from Qualification
                </Button>
              </div>
            )}
            <BomTable items={bomItems} />
          </div>
        </TabsContent>

        {/* Tab 6: Commercial Offer */}
        <TabsContent value="offers">
          <OfferView
            solutionCase={solutionCase}
            onApproveOffer={handleApproveOffer}
            onGenerateOffer={handleGenerateOfferDraft}
          />
        </TabsContent>

        {/* Tab 7: Timeline & Audit */}
        <TabsContent value="timeline">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            {canViewAudit ? (
              <CaseTimeline logs={auditLogs} />
            ) : (
              <p className="text-xs text-slate-400">
                Your role does not have permission to view the audit trail.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Expert Triage Modal */}
      {selectedExpertRequest && (
        <ExpertTriageModal
          isOpen={true}
          onClose={() => setSelectedExpertRequest(null)}
          request={selectedExpertRequest}
          onSaveResponse={handleSaveExpertResponse}
        />
      )}
    </div>
  );
}
