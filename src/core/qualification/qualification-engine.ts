/**
 * Deterministic Qualification Engine Orchestrator
 * Evaluates all domain rules, generates explainable qualification badges,
 * flags missing information, and determines if expert escalation is mandatory.
 */

import { SolutionCase, QualificationResult, TelecomDomain, BomItem } from "../domain/types";
import { evaluateTelephonyRules } from "./rules/telephony-rules";
import { evaluateNetworkRules } from "./rules/network-rules";
import { evaluateWifiRules } from "./rules/wifi-rules";
import { evaluateSecurityRules } from "./rules/security-rules";

export class QualificationEngine {
  /**
   * Executes deterministic evaluation of the case against all domain rules
   */
  static evaluateCase(solutionCase: SolutionCase): QualificationResult {
    const telephonyItems = evaluateTelephonyRules(solutionCase);
    const networkItems = evaluateNetworkRules(solutionCase);
    const wifiItems = evaluateWifiRules(solutionCase);
    const securityItems = evaluateSecurityRules(solutionCase);

    const allItems = [
      ...telephonyItems,
      ...networkItems,
      ...wifiItems,
      ...securityItems
    ];

    // Identify missing information flags
    const missingFlags: string[] = [];
    if (!solutionCase.questionnaire.desiredBandwidthDownMbps) {
      missingFlags.push("Desired internet download bandwidth not specified");
    }
    if (solutionCase.questionnaire.telephonyEndpointsCount === 0 && solutionCase.questionnaire.telephonyAction !== "RENEW") {
      missingFlags.push("Telephony endpoint count not specified");
    }
    if (solutionCase.sites.length === 0) {
      missingFlags.push("No customer sites registered");
    }

    // Determine domains requiring expert escalation
    const expertDomains = new Set<TelecomDomain>();
    for (const item of allItems) {
      if (item.requiresExpertEscalation || item.status === "REQUIRES_EXPERT_VALIDATION") {
        expertDomains.add(item.domain);
      }
    }

    const expertEscalationsNeeded = Array.from(expertDomains);

    // Overall eligibility
    let overallEligibility: "ELIGIBLE" | "REQUIRES_REVIEW" | "INELIGIBLE" = "ELIGIBLE";
    if (allItems.some((i) => i.status === "INCOMPATIBLE" || i.status === "UNAVAILABLE")) {
      overallEligibility = "INELIGIBLE";
    } else if (expertEscalationsNeeded.length > 0 || missingFlags.length > 0) {
      overallEligibility = "REQUIRES_REVIEW";
    }

    return {
      evaluatedAt: new Date().toISOString(),
      overallEligibility,
      items: allItems,
      missingInformationFlags: missingFlags,
      expertEscalationsNeeded,
      summary: {
        en: `Qualification completed with ${allItems.length} domain rules evaluated. ${
          expertEscalationsNeeded.length > 0
            ? `${expertEscalationsNeeded.length} domain(s) require expert validation.`
            : "All core requirements deterministic and eligible."
        }`,
        fr: `Qualification terminée avec ${allItems.length} règles métier évaluées. ${
          expertEscalationsNeeded.length > 0
            ? `${expertEscalationsNeeded.length} domaine(s) requièrent une validation d'expert.`
            : "L'ensemble des critères est déterministe et conforme."
        }`
      }
    };
  }

  /**
   * Generates auto-suggested BOM items from the qualification result
   */
  static generateSuggestedBomItems(solutionCase: SolutionCase, result: QualificationResult): BomItem[] {
    const suggestedBom: BomItem[] = [];

    for (const item of result.items) {
      if (item.suggestedCatalogItemId && item.status !== "REQUIRES_EXPERT_VALIDATION" && item.status !== "INCOMPATIBLE") {
        const qty = item.suggestedQuantity || 1;
        
        let productName = item.suggestedCatalogItemId;
        let category: BomItem["category"] = "HARDWARE";
        let capexUnit = 0;
        let opexMonthlyUnit = 0;

        if (item.suggestedCatalogItemId === "TEL-PROD-CLOUDPBX-LIC") {
          productName = "Cloud PBX Enterprise User License";
          category = "LICENSE";
          capexUnit = 0;
          opexMonthlyUnit = 14.90;
        } else if (item.suggestedCatalogItemId === "NET-PROD-SWITCH-24POE") {
          productName = "24-Port Gigabit Managed PoE+ Switch with Voice QoS";
          category = "HARDWARE";
          capexUnit = 650;
          opexMonthlyUnit = 0;
        } else if (item.suggestedCatalogItemId === "TEL-PROD-PHONE-RECEPTION") {
          productName = "Executive Touch IP Phone + Attendant Expansion Module";
          category = "HARDWARE";
          capexUnit = 290;
          opexMonthlyUnit = 0;
        } else if (item.suggestedCatalogItemId === "WAN-PROD-FTTO-1GBPS") {
          productName = "Dedicated Symmetrical FTTO Fiber 1Gbps / 1Gbps (GTR 4h 24/7)";
          category = "CONNECTIVITY";
          capexUnit = 450;
          opexMonthlyUnit = 390.00;
        } else if (item.suggestedCatalogItemId === "WAN-PROD-FTTH-PRO") {
          productName = "Pro Shared FTTH Fiber 1Gbps / 500Mbps";
          category = "CONNECTIVITY";
          capexUnit = 150;
          opexMonthlyUnit = 79.00;
        } else if (item.suggestedCatalogItemId === "WAN-PROD-5G-ROUTER") {
          productName = "Dual-SIM 5G Cellular Backup Gateway + Telco Data SIM";
          category = "HARDWARE";
          capexUnit = 380;
          opexMonthlyUnit = 35.00;
        } else if (item.suggestedCatalogItemId === "WIFI-PROD-AP6-PRO") {
          productName = "Enterprise Wi-Fi 6 Cloud-Managed Access Point";
          category = "HARDWARE";
          capexUnit = 220;
          opexMonthlyUnit = 8.00;
        } else if (item.suggestedCatalogItemId === "WIFI-PROD-GUEST-PORTAL-LIC") {
          productName = "Captive Portal SaaS & SMS OTP Authentication Pack";
          category = "LICENSE";
          capexUnit = 0;
          opexMonthlyUnit = 29.00;
        } else if (item.suggestedCatalogItemId === "SEC-PROD-FW-NG70F") {
          productName = "Next-Gen Firewall Appliance (FortiGate 70F) + 3-Yr UTM Protection";
          category = "HARDWARE";
          capexUnit = 1450;
          opexMonthlyUnit = 65.00;
        } else if (item.suggestedCatalogItemId === "SEC-PROD-UTM-RENEWAL-1Y") {
          productName = "12-Month UTM Threat Protection & IPS Signature Renewal";
          category = "LICENSE";
          capexUnit = 0;
          opexMonthlyUnit = 45.00;
        }

        suggestedBom.push({
          id: `BOM-${item.id}-${Date.now().toString().slice(-4)}`,
          domain: item.domain,
          productCode: item.suggestedCatalogItemId,
          productName,
          category,
          quantity: qty,
          unit: "unit",
          capexUnitEur: capexUnit,
          opexMonthlyUnitEur: opexMonthlyUnit,
          capexTotalEur: capexUnit * qty,
          opexMonthlyTotalEur: opexMonthlyUnit * qty,
          mandatory: true,
          source: "AUTO_QUALIFICATION",
          ruleCitation: item.ruleCode
        });
      }
    }

    return suggestedBom;
  }
}
