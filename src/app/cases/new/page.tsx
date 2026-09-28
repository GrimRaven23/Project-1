"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DatabaseRepository } from "@/core/storage/database";
import { SolutionCase } from "@/core/domain/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { ArrowLeft, Building2, PlusCircle, Check } from "lucide-react";

export default function NewCasePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const customers = DatabaseRepository.getCustomers();

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  const [caseTitle, setCaseTitle] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = DatabaseRepository.getCustomerById(selectedCustomerId);
    if (!customer) return;

    const caseNum = `CASE-2026-00${DatabaseRepository.getCases().length + 1}`;
    const newCase: SolutionCase = {
      id: caseNum,
      caseNumber: caseNum,
      customerId: customer.id,
      customer,
      title: caseTitle || `${customer.companyName} - Solution Qualification`,
      assignedCommercialId: currentUser.id,
      assignedCommercialName: currentUser.name,
      participatingExpertDomains: ["NETWORK_SDWAN", "CYBERSECURITY_FIREWALL"],
      lifecycleState: "INTAKE_IN_PROGRESS",
      priority,
      classification: "CUSTOMER_CONFIDENTIAL",
      version: 1,
      completenessPercentage: 25,
      sites: [
        {
          id: `SITE-${Date.now().toString().slice(-4)}`,
          customerId: customer.id,
          siteName: `${customer.companyName} - Siège Principal`,
          address: "10 Boulevard Haussmann",
          postalCode: "75009",
          city: "Paris",
          country: "France",
          buildingType: "OFFICE_HQ",
          floorsCount: 2,
          areaSquareMeters: 650,
          totalStaffCount: 40,
          areas: {
            smallOfficesCount: 8,
            corridorsLinearMeters: 50,
            meetingRoomsCount: 2,
            largeOpenSpacesCount: 1
          }
        }
      ],
      existingAssets: [],
      questionnaire: {
        telephonyEndpointsCount: 25,
        telephonyCategory: "MIXED",
        telephonyBreakdown: {
          executiveCount: 5,
          standardCount: 18,
          receptionistCount: 1,
          softphoneOnlyCount: 1
        },
        hasLegacyIsdnT0T2: false,
        hasExistingSipTrunk: true,
        desiredTelephonyFeatures: ["CALL_RECORDING", "MOBILE_APP"],
        telephonyAction: "EXPAND",

        internetStatus: "SHARED_FTTH",
        existingBandwidthDownMbps: 300,
        existingBandwidthUpMbps: 100,
        desiredBandwidthDownMbps: 1000,
        desiredBandwidthUpMbps: 1000,
        isSymmetricalRequired: true,
        gtrRequiredHours: 4,
        requiresCellularBackup: true,
        requiresMultiSiteSdWan: false,

        wifiCoverageRequired: true,
        wifiDesiredFeatures: ["WIFI_6", "CAPTIVE_PORTAL"],
        wifiOutdoorRequired: false,

        hasExistingFirewall: true,
        existingFirewallModel: "FortiGate 60E",
        firewallAgeYears: 3,
        firewallLicenseValid: true,
        requiredSecurityCapabilities: ["ANTIVIRUS_IPS", "IPSEC_VPN"],
        concurrentVpnUsersNeeded: 15,
        requiresCaptivePortal: false
      },
      expertRequests: [],
      bomItems: [],
      offers: [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    DatabaseRepository.saveCase(newCase, currentUser);
    router.push(`/cases/${newCase.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/cases" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back to Cases
      </Link>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Initialize New Customer Solution Case
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an intake workspace to capture multi-site requirements, baseline assets, and launch qualification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Enterprise Customer Account
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.sirenOrVat}) • {c.industrySegment}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Case / Project Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Multi-Site Fiber, Cloud PBX & Security Modernization"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Commercial Deal Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium"
            >
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Priority (SLA 24h)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Link href="/cases">
              <Button type="button" variant="outline">
                {t.common.cancel}
              </Button>
            </Link>
            <Button type="submit" variant="telecom">
              <Check className="w-4 h-4" /> Create Case Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
