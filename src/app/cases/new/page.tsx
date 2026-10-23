"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Customer, Site } from "@/core/domain/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { apiGet, apiSend, ApiError } from "@/lib/api/client";
import {
  ArrowLeft,
  Plus,
  PlusCircle,
  Check,
  Loader2,
  AlertCircle,
  Building2,
  MapPin,
  Info
} from "lucide-react";

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
const CLASSIFICATIONS = ["PUBLIC", "INTERNAL", "CUSTOMER_CONFIDENTIAL", "RESTRICTED"] as const;

export default function NewCasePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { hasPermission } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("NORMAL");
  const [classification, setClassification] = useState<(typeof CLASSIFICATIONS)[number]>(
    "CUSTOMER_CONFIDENTIAL"
  );
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);

  // Questionnaire — the qualification engine needs real inputs to produce a
  // meaningful verdict, so these are captured rather than hard-coded.
  const [telephonyEndpoints, setTelephonyEndpoints] = useState(10);
  const [hasLegacyIsdn, setHasLegacyIsdn] = useState(false);
  const [desiredDown, setDesiredDown] = useState(500);
  const [desiredUp, setDesiredUp] = useState(500);
  const [gtrHours, setGtrHours] = useState<4 | 8 | 24 | 48>(24);
  const [cellularBackup, setCellularBackup] = useState(false);
  const [wifiRequired, setWifiRequired] = useState(false);
  const [firewallRequired, setFirewallRequired] = useState(false);
  const [sslInspection, setSslInspection] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canCreate = hasPermission("cases:create");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<{ data: Customer[] }>("/api/customers");
        if (cancelled) return;
        setCustomers(res.data || []);
        if (res.data?.length) setSelectedCustomerId(res.data[0].id);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "Failed to load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSites = useCallback(async (customerId: string) => {
    if (!customerId) {
      setSites([]);
      setSelectedSiteIds([]);
      return;
    }
    try {
      const res = await apiGet<{ data: Site[] }>(`/api/customers/${customerId}/sites`);
      setSites(res.data || []);
      setSelectedSiteIds([]);
    } catch {
      setSites([]);
      setSelectedSiteIds([]);
    }
  }, []);

  useEffect(() => {
    void loadSites(selectedCustomerId);
  }, [selectedCustomerId, loadSites]);

  const toggleSite = (id: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    setSubmitting(true);
    setSubmitError(null);

    const securityCapabilities: string[] = [];
    if (firewallRequired) securityCapabilities.push("ANTIVIRUS_IPS", "IPSEC_VPN");
    if (sslInspection) securityCapabilities.push("SSL_DEEP_INSPECTION");

    try {
      const res = await apiSend<{ data: { id: string } }>("/api/cases", "POST", {
        customerId: selectedCustomerId,
        title: caseTitle,
        priority,
        classification,
        siteIds: selectedSiteIds,
        questionnaire: {
          telephonyEndpointsCount: telephonyEndpoints,
          telephonyCategory: "STANDARD",
          telephonyBreakdown: {
            executiveCount: 0,
            standardCount: telephonyEndpoints,
            receptionistCount: 0,
            softphoneOnlyCount: 0
          },
          hasLegacyIsdnT0T2: hasLegacyIsdn,
          hasExistingSipTrunk: !hasLegacyIsdn,
          desiredTelephonyFeatures: [],
          telephonyAction: hasLegacyIsdn ? "MIGRATE_CLOUD" : "RENEW",
          internetStatus: "SHARED_FTTH",
          existingBandwidthDownMbps: 0,
          existingBandwidthUpMbps: 0,
          desiredBandwidthDownMbps: desiredDown,
          desiredBandwidthUpMbps: desiredUp,
          isSymmetricalRequired: desiredDown === desiredUp,
          gtrRequiredHours: gtrHours,
          requiresCellularBackup: cellularBackup,
          requiresMultiSiteSdWan: selectedSiteIds.length > 1,
          wifiCoverageRequired: wifiRequired,
          wifiDesiredFeatures: wifiRequired ? ["WIFI_6"] : [],
          wifiOutdoorRequired: false,
          hasExistingFirewall: false,
          firewallAgeYears: 0,
          firewallLicenseValid: false,
          requiredSecurityCapabilities: securityCapabilities,
          concurrentVpnUsersNeeded: 0,
          requiresCaptivePortal: false
        }
      });

      router.push(`/cases/${res.data.id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to create case");
      setSubmitting(false);
    }
  };

  const field =
    "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const label = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-sm text-slate-500">
        Your role does not have permission to create solution cases.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/cases"
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> {t.navigation.cases}
      </Link>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Initialize New Customer Solution Case
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an intake workspace to capture multi-site requirements and launch qualification.
          </p>
        </div>

        {loadError && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {customers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">
              You need a customer account before you can open a solution case.
            </p>
            <Link href="/customers">
              <Button variant="primary" size="sm">
                <PlusCircle className="w-4 h-4" /> Create a Customer First
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={label}>Select Enterprise Customer Account</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className={field}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.sirenOrVat}) • {c.industrySegment}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={label}>Case / Project Title *</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={200}
                placeholder="e.g. Multi-Site Fiber, Cloud PBX & Security Modernization"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                className={field}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Commercial Deal Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                  className={field}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p === "URGENT" ? "Urgent (SLA 24h)" : p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Information Classification</label>
                <select
                  value={classification}
                  onChange={(e) =>
                    setClassification(e.target.value as (typeof CLASSIFICATIONS)[number])
                  }
                  className={field}
                >
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sites */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={label}>Sites in Scope</label>
                <Link
                  href="/customers"
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Manage Sites
                </Link>
              </div>
              {sites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-xs text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  No registered sites for this customer yet. Sites drive Wi-Fi density and fibre
                  eligibility, so add them for an accurate qualification.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sites.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                        selectedSiteIds.includes(s.id)
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSiteIds.includes(s.id)}
                        onChange={() => toggleSite(s.id)}
                        className="rounded border-slate-300"
                      />
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{s.siteName}</span> — {s.city},{" "}
                        {s.country} • {s.areaSquareMeters} m² • {s.totalStaffCount} staff
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Questionnaire */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Qualification Intake
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Telephony Endpoints</label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={telephonyEndpoints}
                    onChange={(e) => setTelephonyEndpoints(Number(e.target.value))}
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Guaranteed Repair (GTR)</label>
                  <select
                    value={gtrHours}
                    onChange={(e) => setGtrHours(Number(e.target.value) as 4 | 8 | 24 | 48)}
                    className={field}
                  >
                    <option value={4}>4 hours</option>
                    <option value={8}>8 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Desired Download (Mbps)</label>
                  <input
                    type="number"
                    min={0}
                    value={desiredDown}
                    onChange={(e) => setDesiredDown(Number(e.target.value))}
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Desired Upload (Mbps)</label>
                  <input
                    type="number"
                    min={0}
                    value={desiredUp}
                    onChange={(e) => setDesiredUp(Number(e.target.value))}
                    className={field}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <Toggle checked={hasLegacyIsdn} onChange={setHasLegacyIsdn} label="Legacy ISDN T0/T2" />
                <Toggle checked={cellularBackup} onChange={setCellularBackup} label="4G/5G failover backup" />
                <Toggle checked={wifiRequired} onChange={setWifiRequired} label="Wi-Fi coverage required" />
                <Toggle checked={firewallRequired} onChange={setFirewallRequired} label="Next-Gen Firewall" />
                <Toggle checked={sslInspection} onChange={setSslInspection} label="SSL deep inspection" />
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Link href="/cases">
                <Button type="button" variant="outline">
                  {t.common.cancel}
                </Button>
              </Link>
              <Button type="submit" variant="telecom" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}{" "}
                Create Case Workspace
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}
