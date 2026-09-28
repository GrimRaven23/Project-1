/**
 * Product & Service Catalog Service
 * Manages telecom items, lifecycle versions, compatibility rules, and renewal associations.
 */

import { TelecomDomain } from "../domain/types";

export interface CatalogProduct {
  id: string;
  code: string;
  domain: TelecomDomain;
  category: "HARDWARE" | "CONNECTIVITY" | "LICENSE" | "SERVICE_INSTALL" | "SUPPORT_SLA";
  name: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  lifecycleState: "ACTIVE" | "DEPRECATED" | "END_OF_SALE" | "RETIRED";
  version: string;
  capexPriceEur: number;
  opexMonthlyEur: number;
  compatibilityTags: string[];
  replacementForCodes?: string[];
  requiresProfessionalInstall: boolean;
}

export const SEED_CATALOG_PRODUCTS: CatalogProduct[] = [
  // Telephony
  {
    id: "CAT-TEL-001",
    code: "TEL-PROD-CLOUDPBX-LIC",
    domain: "TELEPHONY",
    category: "LICENSE",
    name: {
      en: "Cloud PBX Enterprise User License",
      fr: "Licence Utilisateur Cloud PBX Entreprise"
    },
    description: {
      en: "Cloud telephony seat including unlimited national calls, mobile app, and voicemail-to-email.",
      fr: "Poste téléphonique hébergé avec appels illimités France/Europe, application mobile et messagerie vocale par email."
    },
    lifecycleState: "ACTIVE",
    version: "2.4",
    capexPriceEur: 0,
    opexMonthlyEur: 14.90,
    compatibilityTags: ["VOIP", "SIP", "CLOUD"],
    requiresProfessionalInstall: false
  },
  {
    id: "CAT-TEL-002",
    code: "TEL-PROD-PHONE-EXEC",
    domain: "TELEPHONY",
    category: "HARDWARE",
    name: {
      en: "Executive Gigabit IP Phone (Color Screen)",
      fr: "Poste IP Haut de Gamme Gigabit (Écran Couleur)"
    },
    description: {
      en: "High-definition enterprise desk phone with 16 SIP accounts, PoE, and Bluetooth.",
      fr: "Poste IP de direction avec 16 comptes SIP, écran tactile couleur, PoE et Bluetooth intégré."
    },
    lifecycleState: "ACTIVE",
    version: "1.2",
    capexPriceEur: 185.00,
    opexMonthlyEur: 0,
    compatibilityTags: ["SIP", "POE", "GIGABIT"],
    requiresProfessionalInstall: false
  },
  {
    id: "CAT-TEL-003",
    code: "TEL-PROD-PHONE-RECEPTION",
    domain: "TELEPHONY",
    category: "HARDWARE",
    name: {
      en: "Executive Phone + Attendant Expansion Module",
      fr: "Poste Opératrice + Console d'Extension 20 Touches"
    },
    description: {
      en: "Receptionist console with 20 physical programmable keys and multi-line busy lamp field (BLF).",
      fr: "Poste d'accueil standardiste avec 20 touches programmables physiques et supervision de ligne (BLF)."
    },
    lifecycleState: "ACTIVE",
    version: "1.0",
    capexPriceEur: 290.00,
    opexMonthlyEur: 0,
    compatibilityTags: ["SIP", "POE", "BLF"],
    requiresProfessionalInstall: true
  },

  // Network & WAN
  {
    id: "CAT-WAN-001",
    code: "WAN-PROD-FTTO-1GBPS",
    domain: "NETWORK_SDWAN",
    category: "CONNECTIVITY",
    name: {
      en: "Dedicated Symmetrical FTTO Fiber 1Gbps / 1Gbps",
      fr: "Fibre Dédiée FTTO Symétrique 1 Gbit/s (GTR 4h 24/7)"
    },
    description: {
      en: "Dedicated enterprise fiber with 100% guaranteed symmetrical bandwidth and 4-hour GTR 24/7.",
      fr: "Lien fibre optique dédié d'entreprise avec 100% de bande passante garantie et GTR 4h contractuelle 24/7."
    },
    lifecycleState: "ACTIVE",
    version: "3.0",
    capexPriceEur: 450.00,
    opexMonthlyEur: 390.00,
    compatibilityTags: ["FIBER", "FTTO", "GTR4H", "SYMMETRICAL"],
    requiresProfessionalInstall: true
  },
  {
    id: "CAT-WAN-002",
    code: "WAN-PROD-FTTH-PRO",
    domain: "NETWORK_SDWAN",
    category: "CONNECTIVITY",
    name: {
      en: "Pro Shared FTTH Fiber 1Gbps / 500Mbps",
      fr: "Fibre Pro Mutualisée FTTH 1 Gbit/s / 500 Mbit/s"
    },
    description: {
      en: "Cost-effective high-speed business fiber with fixed IP and GTR 8h business hours.",
      fr: "Accès très haut débit économique avec adresse IP fixe et GTR 8h heures ouvrées."
    },
    lifecycleState: "ACTIVE",
    version: "2.1",
    capexPriceEur: 150.00,
    opexMonthlyEur: 79.00,
    compatibilityTags: ["FIBER", "FTTH", "GTR8H"],
    requiresProfessionalInstall: true
  },
  {
    id: "CAT-WAN-003",
    code: "WAN-PROD-5G-ROUTER",
    domain: "NETWORK_SDWAN",
    category: "HARDWARE",
    name: {
      en: "Dual-SIM 5G Cellular Backup Gateway",
      fr: "Routeur Secours 4G/5G Dual-SIM Automatique"
    },
    description: {
      en: "Automated hardware failover router ensuring uninterrupted business connectivity during fiber cuts.",
      fr: "Passerelle de secours cellulaire avec basculement automatique et conservation de l'adresse IP publique."
    },
    lifecycleState: "ACTIVE",
    version: "1.5",
    capexPriceEur: 380.00,
    opexMonthlyEur: 35.00,
    compatibilityTags: ["5G", "FAILOVER", "BACKUP"],
    requiresProfessionalInstall: true
  },

  // Wi-Fi
  {
    id: "CAT-WIFI-001",
    code: "WIFI-PROD-AP6-PRO",
    domain: "WIFI",
    category: "HARDWARE",
    name: {
      en: "Enterprise Wi-Fi 6 Cloud-Managed Access Point",
      fr: "Borne Wi-Fi 6 Managée dans le Cloud (802.11ax)"
    },
    description: {
      en: "High-density dual-band Wi-Fi 6 access point supporting up to 250 concurrent client devices.",
      fr: "Point d'accès Wi-Fi 6 bi-bande haute densité supportant jusqu'à 250 terminaux simultanés."
    },
    lifecycleState: "ACTIVE",
    version: "2.0",
    capexPriceEur: 220.00,
    opexMonthlyEur: 8.00,
    compatibilityTags: ["WIFI6", "POE", "CLOUD_MANAGED"],
    requiresProfessionalInstall: true
  },
  {
    id: "CAT-WIFI-002",
    code: "WIFI-PROD-GUEST-PORTAL-LIC",
    domain: "WIFI",
    category: "LICENSE",
    name: {
      en: "Captive Portal SaaS & SMS OTP Authentication",
      fr: "Module Portail Captif Invité & Authentification SMS"
    },
    description: {
      en: "GDPR compliant visitor management portal with branded login, voucher generation, and SMS OTP.",
      fr: "Portail d'accueil visiteurs conforme RGPD avec validation SMS, coupons d'accès et traçabilité légale."
    },
    lifecycleState: "ACTIVE",
    version: "1.3",
    capexPriceEur: 0,
    opexMonthlyEur: 29.00,
    compatibilityTags: ["CAPTIVE_PORTAL", "GDPR", "SMS_AUTH"],
    requiresProfessionalInstall: false
  },

  // Cybersecurity
  {
    id: "CAT-SEC-001",
    code: "SEC-PROD-FW-NG70F",
    domain: "CYBERSECURITY_FIREWALL",
    category: "HARDWARE",
    name: {
      en: "Next-Gen Firewall Appliance (FortiGate 70F)",
      fr: "Pare-feu Next-Gen FortiGate 70F + Pack UTM 3 Ans"
    },
    description: {
      en: "Enterprise UTM firewall with dedicated security processors for SSL inspection, IPS, and Antivirus.",
      fr: "Appliance pare-feu professionnelle avec processeur SOC4, inspection SSL matériel et filtrage d'URL."
    },
    lifecycleState: "ACTIVE",
    version: "2.0",
    capexPriceEur: 1450.00,
    opexMonthlyEur: 65.00,
    compatibilityTags: ["FIREWALL", "UTM", "SSL_INSPECT", "IPSEC_VPN"],
    replacementForCodes: ["OLD-FORTIGATE-60D", "OLD-NETGEAR-VPN", "OLD-SONICWALL-TZ"],
    requiresProfessionalInstall: true
  },
  {
    id: "CAT-SEC-002",
    code: "SEC-PROD-UTM-RENEWAL-1Y",
    domain: "CYBERSECURITY_FIREWALL",
    category: "LICENSE",
    name: {
      en: "12-Month UTM Threat Protection & IPS Subscription",
      fr: "Renouvellement 12 Mois Souscription UTM & Antivirus"
    },
    description: {
      en: "Annual security subscription for active threat feeds, antivirus definitions, and firmware updates.",
      fr: "Mise à jour des signatures de sécurité en temps réel, base de menaces et support constructeur."
    },
    lifecycleState: "ACTIVE",
    version: "1.0",
    capexPriceEur: 0,
    opexMonthlyEur: 45.00,
    compatibilityTags: ["UTM_RENEWAL", "ANTIVIRUS", "IPS"],
    requiresProfessionalInstall: false
  }
];

export class CatalogService {
  private static products: CatalogProduct[] = [...SEED_CATALOG_PRODUCTS];

  static getAllProducts(): CatalogProduct[] {
    return this.products;
  }

  static getProductsByDomain(domain: TelecomDomain): CatalogProduct[] {
    return this.products.filter((p) => p.domain === domain);
  }

  static getProductByCode(code: string): CatalogProduct | undefined {
    return this.products.find((p) => p.code === code);
  }

  static addProduct(product: CatalogProduct): void {
    this.products.push(product);
  }
}
