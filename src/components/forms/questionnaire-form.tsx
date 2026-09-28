"use client";

import React, { useState } from "react";
import { DynamicQuestionnaireAnswer } from "@/core/domain/types";
import { Button } from "@/components/ui/button";
import { Phone, Globe, Wifi, Shield, Save, CheckCircle2 } from "lucide-react";

interface QuestionnaireFormProps {
  initialData: DynamicQuestionnaireAnswer;
  onSave: (data: DynamicQuestionnaireAnswer) => void;
}

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<DynamicQuestionnaireAnswer>(initialData);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = <K extends keyof DynamicQuestionnaireAnswer>(
    field: K,
    value: DynamicQuestionnaireAnswer[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBreakdownChange = (field: keyof DynamicQuestionnaireAnswer["telephonyBreakdown"], value: number) => {
    setFormData((prev) => ({
      ...prev,
      telephonyBreakdown: {
        ...prev.telephonyBreakdown,
        [field]: value
      }
    }));
  };

  const toggleFeature = (listField: "desiredTelephonyFeatures" | "wifiDesiredFeatures" | "requiredSecurityCapabilities", item: string) => {
    const list = formData[listField] || [];
    const updated = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    handleChange(listField, updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Telephony Section */}
      <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-sm">
          <Phone className="w-4 h-4" />
          <span>1. Telephony & UCaaS Requirements</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Endpoints Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.telephonyEndpointsCount}
              onChange={(e) => handleChange("telephonyEndpointsCount", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endpoint Tier / Category
            </label>
            <select
              value={formData.telephonyCategory}
              onChange={(e) => handleChange("telephonyCategory", e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="BASIC">Standard IP Phone</option>
              <option value="PREMIUM">Executive / Touchscreen</option>
              <option value="MIXED">Mixed Fleet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Desired Telephony Action
            </label>
            <select
              value={formData.telephonyAction}
              onChange={(e) => handleChange("telephonyAction", e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="MIGRATE_CLOUD">Migrate to Cloud PBX (Centrex)</option>
              <option value="REPLACE_ALL">Replace Entire Fleet & PBX</option>
              <option value="RENEW">Renew Existing Contract</option>
              <option value="EXPAND">Add Endpoints Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-100 dark:border-purple-900/50">
          <div>
            <label className="block text-[11px] text-slate-500">Executive Desks</label>
            <input
              type="number"
              min="0"
              value={formData.telephonyBreakdown.executiveCount}
              onChange={(e) => handleBreakdownChange("executiveCount", parseInt(e.target.value) || 0)}
              className="w-full border rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500">Standard Users</label>
            <input
              type="number"
              min="0"
              value={formData.telephonyBreakdown.standardCount}
              onChange={(e) => handleBreakdownChange("standardCount", parseInt(e.target.value) || 0)}
              className="w-full border rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500">Receptionist Console</label>
            <input
              type="number"
              min="0"
              value={formData.telephonyBreakdown.receptionistCount}
              onChange={(e) => handleBreakdownChange("receptionistCount", parseInt(e.target.value) || 0)}
              className="w-full border rounded px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500">Softphone / Mobile Only</label>
            <input
              type="number"
              min="0"
              value={formData.telephonyBreakdown.softphoneOnlyCount}
              onChange={(e) => handleBreakdownChange("softphoneOnlyCount", parseInt(e.target.value) || 0)}
              className="w-full border rounded px-2 py-1 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.hasLegacyIsdnT0T2}
              onChange={(e) => handleChange("hasLegacyIsdnT0T2", e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Customer has legacy ISDN T0/T2 lines (PSTN Switch-off candidate)</span>
          </label>
        </div>
      </div>

      {/* 2. Internet & WAN Section */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
          <Globe className="w-4 h-4" />
          <span>2. Internet Connectivity, Bandwidth & High Availability</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Link Type
            </label>
            <select
              value={formData.internetStatus}
              onChange={(e) => handleChange("internetStatus", e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="COPPER_ADSL_VDSL">Copper ADSL/VDSL</option>
              <option value="SHARED_FTTH">Shared FTTH Pro</option>
              <option value="DEDICATED_FTTO">Dedicated FTTO Fiber</option>
              <option value="NO_LINK">New Site / No Link</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Download Bandwidth (Mbps)
            </label>
            <input
              type="number"
              min="10"
              step="50"
              value={formData.desiredBandwidthDownMbps}
              onChange={(e) => handleChange("desiredBandwidthDownMbps", parseInt(e.target.value) || 100)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Upload Bandwidth (Mbps)
            </label>
            <input
              type="number"
              min="10"
              step="50"
              value={formData.desiredBandwidthUpMbps}
              onChange={(e) => handleChange("desiredBandwidthUpMbps", parseInt(e.target.value) || 100)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Guaranteed Time to Repair (GTR SLA)
            </label>
            <select
              value={formData.gtrRequiredHours}
              onChange={(e) => handleChange("gtrRequiredHours", parseInt(e.target.value) as any)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value={4}>4 Hours GTR (24/7 Dedicated SLA)</option>
              <option value={8}>8 Hours GTR (Business Hours)</option>
              <option value={24}>24 Hours Best Effort</option>
            </select>
          </div>

          <div className="flex flex-col justify-center space-y-2 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.isSymmetricalRequired}
                onChange={(e) => handleChange("isSymmetricalRequired", e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Symmetrical Guaranteed Bandwidth Required</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.requiresCellularBackup}
                onChange={(e) => handleChange("requiresCellularBackup", e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>High Availability 4G/5G Cellular Backup Gateway</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.requiresMultiSiteSdWan}
                onChange={(e) => handleChange("requiresMultiSiteSdWan", e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Inter-Site Multi-Site SD-WAN Mesh Overlay</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Wi-Fi Coverage Section */}
      <div className="rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/30 dark:bg-cyan-950/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold text-sm">
          <Wifi className="w-4 h-4" />
          <span>3. Wi-Fi Coverage & Visitor Access</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={formData.wifiCoverageRequired}
              onChange={(e) => handleChange("wifiCoverageRequired", e.target.checked)}
              className="rounded text-cyan-600 focus:ring-cyan-500"
            />
            <span>Wi-Fi Coverage Required Across Customer Sites</span>
          </label>
        </div>

        {formData.wifiCoverageRequired && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            {[
              { id: "WIFI_6", label: "Wi-Fi 6 (802.11ax)" },
              { id: "CAPTIVE_PORTAL", label: "Guest Captive Portal" },
              { id: "CODE_SMS_AUTH", label: "SMS OTP Authentication" },
              { id: "VLAN_SEGREGATION", label: "VLAN Guest/Internal Isolation" }
            ].map((feat) => {
              const checked = (formData.wifiDesiredFeatures || []).includes(feat.id);
              return (
                <button
                  type="button"
                  key={feat.id}
                  onClick={() => toggleFeature("wifiDesiredFeatures", feat.id)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-colors ${
                    checked
                      ? "bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {feat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Security & Firewall Section */}
      <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
          <Shield className="w-4 h-4" />
          <span>4. Cybersecurity, UTM & Firewalling</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
              <input
                type="checkbox"
                checked={formData.hasExistingFirewall}
                onChange={(e) => handleChange("hasExistingFirewall", e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Has Existing Firewall Appliance</span>
            </label>
            {formData.hasExistingFirewall && (
              <input
                type="text"
                placeholder="Firewall Model (e.g. FortiGate 60D)"
                value={formData.existingFirewallModel || ""}
                onChange={(e) => handleChange("existingFirewallModel", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Firewall Age (Years)
            </label>
            <input
              type="number"
              min="0"
              value={formData.firewallAgeYears}
              onChange={(e) => handleChange("firewallAgeYears", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Concurrent VPN Remote Users Needed
            </label>
            <input
              type="number"
              min="0"
              value={formData.concurrentVpnUsersNeeded}
              onChange={(e) => handleChange("concurrentVpnUsersNeeded", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Required Next-Gen Security Features
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: "ANTIVIRUS_IPS", label: "Antivirus & IPS Intrusion Prevention" },
              { id: "SSL_DEEP_INSPECTION", label: "SSL/TLS Deep Packet Inspection" },
              { id: "APPLICATION_CONTROL", label: "Application Control & QoS" },
              { id: "IPSEC_VPN", label: "IPsec Site-to-Site VPN" }
            ].map((feat) => {
              const checked = (formData.requiredSecurityCapabilities || []).includes(feat.id);
              return (
                <button
                  type="button"
                  key={feat.id}
                  onClick={() => toggleFeature("requiredSecurityCapabilities", feat.id)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-colors ${
                    checked
                      ? "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {feat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <div>
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Requirements saved successfully!
            </span>
          )}
        </div>
        <Button type="submit" variant="telecom" size="md">
          <Save className="w-4 h-4" /> Save Questionnaire & Update Baseline
        </Button>
      </div>
    </form>
  );
};
