/**
 * Cybersecurity, UTM & Next-Gen Firewall Qualification Rules
 */

import { SolutionCase, QualificationItem } from "../../domain/types";

export function evaluateSecurityRules(solutionCase: SolutionCase): QualificationItem[] {
  const items: QualificationItem[] = [];
  const q = solutionCase.questionnaire;
  const existingFw = solutionCase.existingAssets.find((a) => a.category === "FIREWALL");

  // Rule 1: Existing Firewall EOL / Renewal State Check
  if (existingFw) {
    const age = existingFw.installYear ? new Date().getFullYear() - existingFw.installYear : q.firewallAgeYears;
    const isExpired = existingFw.licenseStatus === "EXPIRED" || existingFw.licenseStatus === "EXPIRING_SOON";

    if (age >= 4) {
      items.push({
        id: "QUAL-SEC-FW-REFRESH",
        domain: "CYBERSECURITY_FIREWALL",
        title: "Firewall Hardware Refresh Recommended (End of Life)",
        status: "REPLACEMENT_RECOMMENDED",
        ruleCode: "RULE-SEC-FW-EOL-01",
        explanation: {
          en: `Existing appliance (${existingFw.manufacturer} ${existingFw.model}, age ~${age} years) lacks hardware acceleration for modern TLS 1.3 deep packet inspection. Hardware replacement recommended.`,
          fr: `L'équipement actuel (${existingFw.manufacturer} ${existingFw.model}, ~${age} ans) ne dispose pas des ASIC d'accélération pour l'inspection TLS 1.3. Remplacement matériel préconisé.`
        },
        suggestedAction: {
          en: "Propose Next-Gen Firewall (FortiGate 70F / Cisco Firepower) with 3-Year UTM Enterprise Protection.",
          fr: "Proposer un Firewall Next-Gen (FortiGate 70F / Cisco Firepower) avec pack UTM Enterprise 3 ans."
        },
        requiresExpertEscalation: false,
        suggestedCatalogItemId: "SEC-PROD-FW-NG70F",
        suggestedQuantity: 1
      });
    } else if (isExpired) {
      items.push({
        id: "QUAL-SEC-FW-RENEWAL",
        domain: "CYBERSECURITY_FIREWALL",
        title: "Firewall UTM Security License Renewal Required",
        status: "RENEWAL_REQUIRED",
        ruleCode: "RULE-SEC-FW-RENEW-02",
        explanation: {
          en: `Existing firewall hardware (${existingFw.model}) remains viable, but security signatures and threat feed licenses are expired or expiring.`,
          fr: `Le boîtier firewall (${existingFw.model}) est encore performant, mais les licences de signatures antivirus/IPS et filtrage d'URL sont échues ou arrivent à échéance.`
        },
        suggestedAction: {
          en: "Renew 12/36-Month UTM Enterprise Security License Subscription.",
          fr: "Renouveler la souscription aux licences UTM Enterprise pour 12 ou 36 mois."
        },
        requiresExpertEscalation: false,
        suggestedCatalogItemId: "SEC-PROD-UTM-RENEWAL-1Y",
        suggestedQuantity: 1
      });
    }
  }

  // Rule 2: Advanced SSL Deep Packet Inspection + High User Count Escalation
  const requiresSslInspection = (q.requiredSecurityCapabilities || []).includes("SSL_DEEP_INSPECTION");
  const totalStaff = solutionCase.sites.reduce((acc, s) => acc + (s.totalStaffCount || 0), 0) || 30;

  if (requiresSslInspection && totalStaff >= 50) {
    items.push({
      id: "QUAL-SEC-SSL-SIZING",
      domain: "CYBERSECURITY_FIREWALL",
      title: "SSL/TLS Deep Packet Inspection Throughput Sizing",
      status: "REQUIRES_EXPERT_VALIDATION",
      ruleCode: "RULE-SEC-SSL-THROUGHPUT-03",
      explanation: {
        en: `Enabling SSL Deep Inspection for ${totalStaff} users significantly impacts firewall CPU performance. Sizing must be validated by a Cybersecurity Presales Specialist.`,
        fr: `L'activation du déchiffrement SSL complet pour ${totalStaff} utilisateurs réduit fortement le débit utile du pare-feu. Le dimensionnement doit être validé par un ingénieur cybersécurité.`
      },
      suggestedAction: {
        en: "Escalate to Security Expert for ASIC throughput and certificate architecture review.",
        fr: "Transmettre au spécialiste sécurité pour audit des flux chiffrés et validation du modèle de firewall."
      },
      requiresExpertEscalation: true
    });
  }

  return items;
}
