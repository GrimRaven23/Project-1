/**
 * Telephony & UCaaS Deterministic Qualification Rules
 */

import { SolutionCase, QualificationItem } from "../../domain/types";

export function evaluateTelephonyRules(solutionCase: SolutionCase): QualificationItem[] {
  const items: QualificationItem[] = [];
  const q = solutionCase.questionnaire;
  const assets = solutionCase.existingAssets.filter((a) => a.domain === "TELEPHONY");

  // Rule 1: Legacy ISDN T0/T2 PBX Migration Trigger
  if (q.hasLegacyIsdnT0T2 || assets.some((a) => a.category === "PBX" && a.currentCapacityOrBandwidth.includes("ISDN"))) {
    items.push({
      id: "QUAL-TEL-ISDN-MIGRATE",
      domain: "TELEPHONY",
      title: "Legacy ISDN T0/T2 Retirement & Cloud PBX Migration",
      status: "REPLACEMENT_RECOMMENDED",
      ruleCode: "RULE-TEL-ISDN-01",
      explanation: {
        en: "Customer currently operates legacy ISDN T0/T2 PBX infrastructure scheduled for PSTN switch-off. Direct migration to Cloud PBX with SIP Trunking is strongly recommended.",
        fr: "Le client utilise une infrastructure PABX RTC/RNIS T0/T2 en fin de vie (arrêt du cuivre/RNIS). La migration vers une solution Cloud PBX avec Trunk SIP est requise."
      },
      suggestedAction: {
        en: "Add Cloud PBX User Licenses and Port Existing Phone Numbers.",
        fr: "Ajouter des licences Cloud PBX et planifier la portabilité des numéros SDA."
      },
      requiresExpertEscalation: false,
      suggestedCatalogItemId: "TEL-PROD-CLOUDPBX-LIC",
      suggestedQuantity: q.telephonyEndpointsCount || 10
    });
  }

  // Rule 2: High Endpoint Sizing & Voice QoS Requirement
  if (q.telephonyEndpointsCount >= 20) {
    items.push({
      id: "QUAL-TEL-QOS-BANDWIDTH",
      domain: "TELEPHONY",
      title: "Dedicated Voice VLAN & QoS Traffic Prioritization",
      status: "ADDITIONAL_EQUIPMENT_REQUIRED",
      ruleCode: "RULE-TEL-QOS-02",
      explanation: {
        en: `Customer requires ${q.telephonyEndpointsCount} concurrent voice endpoints. To prevent jitter and packet loss, a dedicated Voice VLAN with guaranteed 100Kbps/call QoS bandwidth is mandatory.`,
        fr: `Le client requiert ${q.telephonyEndpointsCount} postes voix simultanés. Pour éviter la gigue et les pertes de paquets, un VLAN Voix dédié avec QoS 100Kbps/canal garanti est obligatoire.`
      },
      suggestedAction: {
        en: "Ensure Managed Layer-3 Switch and FTTO with SLA are included in BOM.",
        fr: "Vérifier l'inclusion d'un switch manageable Niveau 3 et d'une fibre FTTO avec GTR dans le devis."
      },
      requiresExpertEscalation: false,
      suggestedCatalogItemId: "NET-PROD-SWITCH-24POE",
      suggestedQuantity: Math.ceil(q.telephonyEndpointsCount / 24)
    });
  }

  // Rule 3: Complex Call Center / Attendant Console
  if (q.telephonyBreakdown.receptionistCount > 0 || (q.desiredTelephonyFeatures || []).includes("IVR_AUTO_ATTENDANT")) {
    items.push({
      id: "QUAL-TEL-ATTENDANT-IVR",
      domain: "TELEPHONY",
      title: "Attendant Console & Multi-Level IVR Sizing",
      status: "AVAILABLE",
      ruleCode: "RULE-TEL-IVR-03",
      explanation: {
        en: "Attendant consoles with hardware expansion modules and dynamic IVR auto-attendant are supported in Cloud PBX Advanced Tier.",
        fr: "Les postes opératrices avec modules d'extension physiques et serveurs vocaux interactifs (SVI) sont supportés via l'offre Cloud PBX Avancée."
      },
      suggestedAction: {
        en: "Configure Receptionist Phone Console with DSS Module.",
        fr: "Configurer le poste d'accueil avec console d'extension 20 touches."
      },
      requiresExpertEscalation: false,
      suggestedCatalogItemId: "TEL-PROD-PHONE-RECEPTION",
      suggestedQuantity: q.telephonyBreakdown.receptionistCount || 1
    });
  }

  return items;
}
