/**
 * Internet, Fiber & WAN Deterministic Qualification Rules
 */

import { SolutionCase, QualificationItem } from "../../domain/types";

export function evaluateNetworkRules(solutionCase: SolutionCase): QualificationItem[] {
  const items: QualificationItem[] = [];
  const q = solutionCase.questionnaire;
  const sitesCount = solutionCase.sites.length || 1;

  // Rule 1: Dedicated FTTO Fiber Eligibility vs Shared FTTH
  if (q.isSymmetricalRequired || q.gtrRequiredHours <= 4 || q.desiredBandwidthDownMbps >= 500) {
    items.push({
      id: "QUAL-NET-FTTO-DEDICATED",
      domain: "NETWORK_SDWAN",
      title: "Dedicated FTTO (Fiber to the Office) with 4h GTR",
      status: "AVAILABLE",
      ruleCode: "RULE-WAN-FTTO-01",
      explanation: {
        en: `Customer requires symmetrical bandwidth (${q.desiredBandwidthDownMbps}/${q.desiredBandwidthUpMbps} Mbps) and high SLA (${q.gtrRequiredHours}h GTR). Dedicated FTTO fiber connection is fully qualified.`,
        fr: `Le client requiert un débit symétrique (${q.desiredBandwidthDownMbps}/${q.desiredBandwidthUpMbps} Mbps) et une GTR de ${q.gtrRequiredHours}h. L'accès Fibre Dédiée FTTO est qualifié.`
      },
      suggestedAction: {
        en: "Provision Primary FTTO Link with SLA 4h 24/7.",
        fr: "Provisionner un lien principal Fibre Dédiée FTTO avec GTR 4h 24/7."
      },
      requiresExpertEscalation: false,
      suggestedCatalogItemId: "WAN-PROD-FTTO-1GBPS",
      suggestedQuantity: sitesCount
    });
  } else {
    items.push({
      id: "QUAL-NET-FTTH-PRO",
      domain: "NETWORK_SDWAN",
      title: "Pro Shared FTTH Fiber Access",
      status: "AVAILABLE",
      ruleCode: "RULE-WAN-FTTH-02",
      explanation: {
        en: "Standard business shared FTTH fiber meets bandwidth and budget requirements.",
        fr: "La fibre mutualisée FTTH Pro répond aux besoins de débit et de budget."
      },
      suggestedAction: {
        en: "Provision Pro FTTH Access (1Gbps Down / 500Mbps Up).",
        fr: "Provisionner un accès FTTH Pro (1Gbps descendant / 500Mbps montant)."
      },
      requiresExpertEscalation: false,
      suggestedCatalogItemId: "WAN-PROD-FTTH-PRO",
      suggestedQuantity: sitesCount
    });
  }

  // Rule 2: 4G/5G Cellular Backup Router
  if (q.requiresCellularBackup) {
    items.push({
      id: "QUAL-NET-5G-BACKUP",
      domain: "NETWORK_SDWAN",
      title: "High Availability 4G/5G Failover Router",
      status: "AVAILABLE",
      ruleCode: "RULE-WAN-CELLULAR-03",
      explanation: {
        en: "Business continuity requirement demands automatic hardware cellular failover with shared static IP block.",
        fr: "L'exigence de continuité d'activité nécessite un routeur de secours 4G/5G avec basculement automatique et IP fixe."
      },
      suggestedAction: {
        en: "Add Dual-SIM 5G Backup Router and Unlimited Telco Backup SIM.",
        fr: "Ajouter un routeur 5G Dual-SIM et forfait Data Secours illimité."
      },
      requiresExpertEscalation: false,
      suggestedCatalogItemId: "WAN-PROD-5G-ROUTER",
      suggestedQuantity: sitesCount
    });
  }

  // Rule 3: Multi-Site SD-WAN Mesh Escalation
  if (q.requiresMultiSiteSdWan && sitesCount >= 3) {
    items.push({
      id: "QUAL-NET-SDWAN-MESH",
      domain: "NETWORK_SDWAN",
      title: "Multi-Site SD-WAN Overlay Architecture",
      status: "REQUIRES_EXPERT_VALIDATION",
      ruleCode: "RULE-WAN-SDWAN-EXPERT-04",
      explanation: {
        en: `Interconnecting ${sitesCount} customer sites via encrypted SD-WAN mesh with dynamic application-aware routing requires topology design by Network Presales.`,
        fr: `L'interconnexion de ${sitesCount} sites clients en maillage SD-WAN chiffré avec routage dynamique applicatif requiert une validation d'architecture par un expert réseau.`
      },
      suggestedAction: {
        en: "Escalate to Network & SD-WAN Specialist for topology sizing.",
        fr: "Transmettre au spécialiste Réseau & SD-WAN pour dimensionnement du tunnel et débit inter-sites."
      },
      requiresExpertEscalation: true
    });
  }

  return items;
}
