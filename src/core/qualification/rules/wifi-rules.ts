/**
 * LAN & Wi-Fi Coverage Sizing Deterministic Qualification Rules
 */

import { SolutionCase, QualificationItem } from "../../domain/types";

export function evaluateWifiRules(solutionCase: SolutionCase): QualificationItem[] {
  const items: QualificationItem[] = [];
  const q = solutionCase.questionnaire;

  if (!q.wifiCoverageRequired) {
    return items;
  }

  // Calculate required Access Points based on site topography
  let totalCalculatedAps = 0;
  for (const site of solutionCase.sites) {
    const smallOffices = site.areas?.smallOfficesCount || 0;
    const corridors = site.areas?.corridorsLinearMeters || 0;
    const meetingRooms = site.areas?.meetingRoomsCount || 0;
    const openSpaces = site.areas?.largeOpenSpacesCount || 0;

    const apsFromOffices = Math.ceil(smallOffices / 3);
    const apsFromCorridors = Math.ceil(corridors / 30);
    const apsFromMeeting = meetingRooms * 1; // 1 dedicated AP per large meeting room
    const apsFromOpen = openSpaces * 2; // 2 APs per large open floor

    const siteAps = Math.max(1, apsFromOffices + apsFromCorridors + apsFromMeeting + apsFromOpen);
    totalCalculatedAps += siteAps;
  }

  if (totalCalculatedAps === 0) totalCalculatedAps = 4; // default minimum

  items.push({
    id: "QUAL-WIFI-AP-SIZING",
    domain: "WIFI",
    title: `Wi-Fi 6 Access Point Density Sizing (${totalCalculatedAps} APs)`,
    status: "AVAILABLE",
    ruleCode: "RULE-WIFI-DENSITY-01",
    explanation: {
      en: `Calculated ${totalCalculatedAps} enterprise Wi-Fi 6 access points based on building layout (small offices, corridors, meeting rooms, and open spaces) for seamless 802.11ax roaming.`,
      fr: `Calcul de ${totalCalculatedAps} bornes Wi-Fi 6 professionnelles selon la typologie des locaux (bureaux fermés, couloirs, salles de réunion et open spaces) pour une couverture optimale sans coupure.`
    },
    suggestedAction: {
      en: "Add Cloud-Managed Wi-Fi 6 Access Points to BOM.",
      fr: "Ajouter les bornes Wi-Fi 6 managées dans le Cloud au devis."
    },
    requiresExpertEscalation: false,
    suggestedCatalogItemId: "WIFI-PROD-AP6-PRO",
    suggestedQuantity: totalCalculatedAps
  });

  // Captive Portal & SMS Authentication Rule
  if (q.requiresCaptivePortal || (q.wifiDesiredFeatures || []).includes("CAPTIVE_PORTAL") || (q.wifiDesiredFeatures || []).includes("CODE_SMS_AUTH")) {
    items.push({
      id: "QUAL-WIFI-GUEST-PORTAL",
      domain: "WIFI",
      title: "Compliant Guest Captive Portal & SMS/Voucher Authentication",
      status: "AVAILABLE",
      ruleCode: "RULE-WIFI-PORTAL-02",
      explanation: {
        en: "Guest portal module with SMS OTP verification, GDPR log retention, and brand customization is compatible.",
        fr: "Le module de portail captif invité avec vérification par SMS OTP, conservation légale des logs (RGPD/Hadopi) et personnalisation graphique est qualifié."
      },
      suggestedAction: {
        en: "Include Cloud Guest Portal & SMS Gateway License.",
        fr: "Inclure la licence Portail Captif Cloud et pack SMS d'authentification."
      },
      requiresExpertEscalation: false,
      suggestedCatalogItemId: "WIFI-PROD-GUEST-PORTAL-LIC",
      suggestedQuantity: 1
    });
  }

  return items;
}
