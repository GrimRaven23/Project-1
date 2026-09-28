"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DatabaseRepository } from "@/core/storage/database";
import { QualificationEngine } from "@/core/qualification/qualification-engine";
import { SolutionCase, DynamicQuestionnaireAnswer, BomItem, ExpertRequest } from "@/core/domain/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionnaireForm } from "@/components/forms/questionnaire-form";
import { QualificationView } from "@/components/qualification/qualification-view";
import { ExpertTriageModal } from "@/components/experts/expert-triage-modal";
import { BomTable } from "@/components/bom/bom-table";
import { OfferView } from "@/components/offers/offer-view";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { AuditService } from "@/core/audit/audit-logger";
import {
  ArrowLeft,
  Building2,
  Phone,
  Globe,
  Wifi,
  Shield,
  Sparkles,
  Headphones,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  History,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params?.id as string;
  const { t, language } = useI18n();
  const { currentUser, hasPermission } = useAuth();

  const [solutionCase, setSolutionCase] = useState<SolutionCase | null>(null);
  const [activeTab, setActiveTab] = useState("qualification");
  const [selectedExpertRequest, setSelectedExpertRequest] = useState<ExpertRequest | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  useEffect(() => {
    if (caseId) {
      const found = DatabaseRepository.getCaseById(caseId);
      if (found) {
        setSolutionCase(found);
      }
    }
  }, [caseId]);

  if (!solutionCase) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Case not found.</p>
        <Link href="/cases">
          <Button variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  // Action: Save Questionnaire
  const handleSaveQuestionnaire = (updatedQ: DynamicQuestionnaireAnswer) => {
    const updated = {
      ...solutionCase,
      questionnaire: updatedQ
    };
    const saved = DatabaseRepository.saveCase(updated, currentUser);
    setSolutionCase(saved);
  };

  // Action: Run Deterministic Qualification
  const handleRunQualification = () => {
    setIsQualifying(true);
    setTimeout(() => {
      const qResult = QualificationEngine.evaluateCase(solutionCase);
      const updatedCase: SolutionCase = {
        ...solutionCase,
        qualificationResult: qResult,
        lifecycleState:
          qResult.expertEscalationsNeeded.length > 0
            ? "EXPERT_REVIEW_REQUIRED"
            : "QUALIFICATION_COMPLETE"
      };
      const saved = DatabaseRepository.saveCase(updatedCase, currentUser);
      setSolutionCase(saved);
      setIsQualifying(false);
    }, 600);
  };

  // Action: Generate BOM from Qualification
  const handleGenerateBom = () => {
    if (!solutionCase.qualificationResult) return;
    const autoBom = QualificationEngine.generateSuggestedBomItems(
      solutionCase,
      solutionCase.qualificationResult
    );
    const updatedCase: SolutionCase = {
      ...solutionCase,
      bomItems: autoBom,
      lifecycleState: "SOLUTION_READY"
    };
    const saved = DatabaseRepository.saveCase(updatedCase, currentUser);
    setSolutionCase(saved);
    setActiveTab("bom");
  };

  // Action: Escalate Expert Request
  const handleEscalateExpert = (domain: string) => {
    const newReq: ExpertRequest = {
      id: `EXP-REQ-${Date.now().toString().slice(-4)}`,
      caseId: solutionCase.id,
      caseNumber: solutionCase.caseNumber,
      customerName: solutionCase.customer?.companyName || "Client",
      domain: domain as any,
      priority: "HIGH",
      status: "OPEN",
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      questionTitle: `${domain} Architecture & Throughput Review`,
      questionDetail: `Specialist review requested by ${currentUser.name} for case ${solutionCase.caseNumber}. Please validate capacity constraints, topology and provide BOM line items.`,
      requestedDeadline: new Date(Date.now() + 3 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedCase: SolutionCase = {
      ...solutionCase,
      expertRequests: [...(solutionCase.expertRequests || []), newReq],
      lifecycleState: "EXPERT_REVIEW_IN_PROGRESS"
    };
    const saved = DatabaseRepository.saveCase(updatedCase, currentUser);
    setSolutionCase(saved);
    setActiveTab("experts");
  };

  // Action: Save Expert Response
  const handleSaveExpertResponse = (requestId: string, response: any) => {
    const updatedRequests = (solutionCase.expertRequests || []).map((r) => {
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

    // If expert suggested BOM items, add them
    let currentBom = [...solutionCase.bomItems];
    if (response.suggestedBomItems && response.suggestedBomItems.length > 0) {
      for (const item of response.suggestedBomItems) {
        currentBom.push({
          id: `BOM-EXP-${Date.now().toString().slice(-4)}`,
          domain: solutionCase.expertRequests.find((r) => r.id === requestId)?.domain || "SOLUTIONS_ARCHITECT",
          productCode: item.productCode,
          productName: item.productName,
          category: "HARDWARE",
          quantity: item.quantity || 1,
          unit: item.unit || "unit",
          capexUnitEur: item.capexEur || 0,
          opexMonthlyUnitEur: item.opexMonthlyEur || 0,
          capexTotalEur: (item.capexEur || 0) * (item.quantity || 1),
          opexMonthlyTotalEur: (item.opexMonthlyEur || 0) * (item.quantity || 1),
          mandatory: true,
          source: "EXPERT_RECOMMENDATION",
          expertJustification: `Added by specialist ${currentUser.name}`
        });
      }
    }

    const updatedCase: SolutionCase = {
      ...solutionCase,
      expertRequests: updatedRequests,
      bomItems: currentBom,
      lifecycleState: "QUALIFICATION_COMPLETE"
    };
    const saved = DatabaseRepository.saveCase(updatedCase, currentUser);
    setSolutionCase(saved);
  };

  // Action: Approve Commercial Offer
  const handleApproveOffer = (offerId: string) => {
    const updatedOffers = (solutionCase.offers || []).map((o) => {
      if (o.id === offerId) {
        return {
          ...o,
          status: "APPROVED" as const,
          approvalByManagerId: currentUser.id,
          approvalDate: new Date().toISOString()
        };
      }
      return o;
    });

    const updatedCase: SolutionCase = {
      ...solutionCase,
      offers: updatedOffers,
      lifecycleState: "APPROVED"
    };
    const saved = DatabaseRepository.saveCase(updatedCase, currentUser);
    setSolutionCase(saved);
  };

  // Action: Generate Offer Draft
  const handleGenerateOfferDraft = () => {
    const totalCapex = solutionCase.bomItems.reduce((acc, i) => acc + i.capexTotalEur, 0);
    const totalOpex = solutionCase.bomItems.reduce((acc, i) => acc + i.opexMonthlyTotalEur, 0);

    const newOffer = {
      id: `OFF-${Date.now().toString().slice(-4)}`,
      caseId: solutionCase.id,
      version: (solutionCase.offers?.length || 0) + 1,
      status: "DRAFT" as const,
      title: `Proposition Commerciale & Technique Globale - ${solutionCase.customer?.companyName}`,
      summaryExecutive: `Solution télécom clé en main incluant les accès Internet Haut Débit, Téléphonie Cloud Unifiée et Sécurisation Réseau selon les préconisations du moteur de qualification.`,
      technicalAssumptions: [
        "GTR 4h contractuelle 24/7 garantie sur les accès FTTO",
        "Portabilité des numéros existants vers le Trunk SIP",
        "Mise à disposition et paramétrage des équipements sur site"
      ],
      totalCapexEur: totalCapex,
      totalMonthlyOpexEur: totalOpex,
      contractTermMonths: 36 as const,
      createdAt: new Date().toISOString()
    };

    const updatedCase: SolutionCase = {
      ...solutionCase,
      offers: [newOffer],
      lifecycleState: "OFFER_PREPARATION"
    };
    const saved = DatabaseRepository.saveCase(updatedCase, currentUser);
    setSolutionCase(saved);
  };

  const auditLogs = AuditService.getLogs({ caseId: solutionCase.id });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back link & Top Meta */}
      <div className="flex items-center justify-between">
        <Link href="/cases" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Cases
        </Link>
        <div className="flex items-center gap-2">
          <Badge status={solutionCase.lifecycleState}>{solutionCase.lifecycleState.replace(/_/g, " ")}</Badge>
          <Badge priority={solutionCase.priority}>{solutionCase.priority} PRIORITY</Badge>
        </div>
      </div>

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

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRunQualification}
              disabled={isQualifying}
              variant="telecom"
              size="md"
            >
              <Sparkles className="w-4 h-4" /> Run Qualification
            </Button>
          </div>
        </div>

        {/* Customer & Sites Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Customer Account</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{solutionCase.customer?.companyName}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Commercial Owner</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{solutionCase.assignedCommercialName}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Sites Connected</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{solutionCase.sites.length} Sites</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Hardware Baseline</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{solutionCase.existingAssets.length} Assets</p>
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
              solutionCase.expertRequests.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                  {solutionCase.expertRequests.length}
                </span>
              ) : undefined
            }
          >
            Specialists
          </TabsTrigger>
          <TabsTrigger value="bom" icon={<FileSpreadsheet className="w-4 h-4" />}>
            BOM ({solutionCase.bomItems.length})
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
                Customer Sites & Topography ({solutionCase.sites.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solutionCase.sites.map((site) => (
                  <div key={site.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{site.siteName}</p>
                    <p className="text-[11px] text-slate-500">{site.address}, {site.postalCode} {site.city}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                      <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">{site.totalStaffCount} Staff</span>
                      <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">{site.areaSquareMeters} m²</span>
                      <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">{site.areas?.smallOfficesCount || 0} Offices</span>
                      <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">{site.areas?.meetingRoomsCount || 0} Meeting Rooms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Hardware Assets */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Existing Equipment Baseline & Delta State ({solutionCase.existingAssets.length})
              </h3>
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
                    {solutionCase.existingAssets.map((asset) => (
                      <tr key={asset.id}>
                        <td className="py-2.5 px-3 font-semibold">{asset.siteName}</td>
                        <td className="py-2.5 px-3"><Badge domain={asset.domain}>{asset.category}</Badge></td>
                        <td className="py-2.5 px-3 font-bold">{asset.manufacturer} {asset.model}</td>
                        <td className="py-2.5 px-3">{asset.installYear}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${asset.licenseStatus === "EXPIRED" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {asset.licenseStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-orange-600">{asset.deltaStatus || "INVESTIGATE"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Specialist Expert Reviews */}
        <TabsContent value="experts">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Specialist Engineering Escalations ({solutionCase.expertRequests.length})
              </h3>
            </div>

            {solutionCase.expertRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge domain={req.domain}>{req.domain}</Badge>
                    <Badge priority={req.priority}>{req.priority} Priority</Badge>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${req.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {req.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.questionTitle}</h4>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedExpertRequest(req)}
                  >
                    Open Full Review & Confidential Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab 5: Bill of Materials */}
        <TabsContent value="bom">
          <BomTable items={solutionCase.bomItems} />
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
            <CaseTimeline logs={auditLogs} />
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
