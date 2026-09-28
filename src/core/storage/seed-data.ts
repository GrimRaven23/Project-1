/**
 * Enterprise Telecom Demo Seed Data
 * Generates realistic customers, multi-site topologies, existing hardware inventories,
 * qualification states, expert review tickets, and commercial offers.
 */

import { Customer, SolutionCase, User } from "../domain/types";

export const SEED_USERS: User[] = [
  {
    id: "USR-COMM-01",
    name: "Alexandre Martin",
    email: "a.martin@telco-enterprise.fr",
    role: "COMMERCIAL_AGENT",
    department: "B2B Sales PME/PMI"
  },
  {
    id: "USR-MGR-01",
    name: "Claire Dupont",
    email: "c.dupont@telco-enterprise.fr",
    role: "COMMERCIAL_MANAGER",
    department: "Commercial Direction"
  },
  {
    id: "USR-EXP-SEC-01",
    name: "Dr. Karim Benali",
    email: "k.benali@telco-enterprise.fr",
    role: "SECURITY_EXPERT",
    department: "Cybersecurity & Firewall Engineering"
  },
  {
    id: "USR-EXP-NET-01",
    name: "Thomas Leroy",
    email: "t.leroy@telco-enterprise.fr",
    role: "NETWORK_EXPERT",
    department: "IP Network & SD-WAN Infrastructure"
  },
  {
    id: "USR-EXP-TEL-01",
    name: "Sophie Vallet",
    email: "s.vallet@telco-enterprise.fr",
    role: "TELEPHONY_EXPERT",
    department: "Unified Communications & Cloud PBX"
  },
  {
    id: "USR-ADMIN-01",
    name: "System Administrator",
    email: "admin@telco-enterprise.fr",
    role: "SUPER_ADMIN",
    department: "IT Operations & Security"
  },
  {
    id: "USR-AUDIT-01",
    name: "Marc Laurent",
    email: "m.laurent@telco-enterprise.fr",
    role: "AUDITOR_COMPLIANCE",
    department: "Internal Audit & Compliance"
  }
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "CUST-001",
    companyName: "AeroTech Solutions SAS",
    sirenOrVat: "FR82947192849",
    industrySegment: "PMI",
    accountManagerId: "USR-COMM-01",
    accountManagerName: "Alexandre Martin",
    primaryContact: {
      name: "Jean-Philippe Moreau",
      email: "jp.moreau@aerotech-solutions.fr",
      phone: "+33 1 42 68 90 12",
      position: "Directeur des Systèmes d'Information (DSI)"
    },
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-09-20T14:30:00Z"
  },
  {
    id: "CUST-002",
    companyName: "BioPharma Laboratories",
    sirenOrVat: "FR44918274619",
    industrySegment: "PME",
    accountManagerId: "USR-COMM-01",
    accountManagerName: "Alexandre Martin",
    primaryContact: {
      name: "Nathalie Bernard",
      email: "n.bernard@biopharma-lab.fr",
      phone: "+33 4 72 39 88 44",
      position: "Responsable Achats & Moyens Généraux"
    },
    createdAt: "2026-09-01T11:20:00Z",
    updatedAt: "2026-09-25T16:00:00Z"
  },
  {
    id: "CUST-003",
    companyName: "LogiTrans International",
    sirenOrVat: "FR19384729103",
    industrySegment: "ENTERPRISE",
    accountManagerId: "USR-COMM-01",
    accountManagerName: "Alexandre Martin",
    primaryContact: {
      name: "Éric Dumas",
      email: "e.dumas@logitrans-group.com",
      phone: "+33 5 56 12 34 56",
      position: "Directeur Technique"
    },
    createdAt: "2026-09-10T08:30:00Z",
    updatedAt: "2026-09-28T10:15:00Z"
  }
];

export const SEED_CASES: SolutionCase[] = [
  {
    id: "CASE-2026-001",
    caseNumber: "CASE-2026-001",
    customerId: "CUST-001",
    customer: SEED_CUSTOMERS[0],
    title: "AeroTech Solutions - Multi-Site Fiber, Cloud PBX & Next-Gen Firewall Modernization",
    assignedCommercialId: "USR-COMM-01",
    assignedCommercialName: "Alexandre Martin",
    participatingExpertDomains: ["CYBERSECURITY_FIREWALL", "TELEPHONY"],
    lifecycleState: "EXPERT_REVIEW_IN_PROGRESS",
    priority: "HIGH",
    classification: "CUSTOMER_CONFIDENTIAL",
    version: 1,
    completenessPercentage: 90,
    sites: [
      {
        id: "SITE-001",
        customerId: "CUST-001",
        siteName: "Siège Social - Paris La Défense",
        address: "42 Avenue de l'Arche",
        postalCode: "92400",
        city: "Courbevoie",
        country: "France",
        buildingType: "OFFICE_HQ",
        floorsCount: 3,
        areaSquareMeters: 1200,
        totalStaffCount: 65,
        areas: {
          smallOfficesCount: 12,
          corridorsLinearMeters: 80,
          meetingRoomsCount: 4,
          largeOpenSpacesCount: 2
        }
      },
      {
        id: "SITE-002",
        customerId: "CUST-001",
        siteName: "Site Industriel & R&D - Toulouse",
        address: "15 Rue des Ailes",
        postalCode: "31700",
        city: "Blagnac",
        country: "France",
        buildingType: "BRANCH_OFFICE",
        floorsCount: 1,
        areaSquareMeters: 800,
        totalStaffCount: 25,
        areas: {
          smallOfficesCount: 4,
          corridorsLinearMeters: 40,
          meetingRoomsCount: 2,
          largeOpenSpacesCount: 1
        }
      }
    ],
    existingAssets: [
      {
        id: "AST-001",
        customerId: "CUST-001",
        siteId: "SITE-001",
        siteName: "Siège Social - Paris La Défense",
        category: "FIREWALL",
        domain: "CYBERSECURITY_FIREWALL",
        manufacturer: "Fortinet",
        model: "FortiGate 60D",
        installYear: 2019,
        licenseStatus: "EXPIRED",
        currentCapacityOrBandwidth: "100 Mbps",
        notes: "Old appliance with expired UTM license, inadequate for 1Gbps fiber.",
        deltaStatus: "REPLACE"
      },
      {
        id: "AST-002",
        customerId: "CUST-001",
        siteId: "SITE-001",
        siteName: "Siège Social - Paris La Défense",
        category: "PBX",
        domain: "TELEPHONY",
        manufacturer: "Alcatel-Lucent",
        model: "OmniPCX Office ISDN T0",
        installYear: 2017,
        licenseStatus: "ACTIVE",
        currentCapacityOrBandwidth: "8 Canaux T0",
        notes: "Legacy physical PBX to be retired due to ISDN phaseout.",
        deltaStatus: "REPLACE"
      }
    ],
    questionnaire: {
      telephonyEndpointsCount: 45,
      telephonyCategory: "MIXED",
      telephonyBreakdown: {
        executiveCount: 10,
        standardCount: 25,
        receptionistCount: 2,
        softphoneOnlyCount: 8
      },
      hasLegacyIsdnT0T2: true,
      hasExistingSipTrunk: false,
      desiredTelephonyFeatures: ["CALL_RECORDING", "IVR_AUTO_ATTENDANT", "TEAMS_INTEGRATION", "MOBILE_APP"],
      telephonyAction: "MIGRATE_CLOUD",

      internetStatus: "SHARED_FTTH",
      existingBandwidthDownMbps: 200,
      existingBandwidthUpMbps: 50,
      desiredBandwidthDownMbps: 1000,
      desiredBandwidthUpMbps: 1000,
      isSymmetricalRequired: true,
      gtrRequiredHours: 4,
      requiresCellularBackup: true,
      requiresMultiSiteSdWan: true,

      wifiCoverageRequired: true,
      wifiDesiredFeatures: ["WIFI_6", "CAPTIVE_PORTAL", "CODE_SMS_AUTH", "VLAN_SEGREGATION"],
      wifiOutdoorRequired: false,

      hasExistingFirewall: true,
      existingFirewallModel: "FortiGate 60D",
      firewallAgeYears: 5,
      firewallLicenseValid: false,
      requiredSecurityCapabilities: ["ANTIVIRUS_IPS", "SSL_DEEP_INSPECTION", "APPLICATION_CONTROL", "IPSEC_VPN"],
      concurrentVpnUsersNeeded: 35,
      requiresCaptivePortal: true,
      securityComplianceRequirement: "ISO 27001 Ready"
    },
    expertRequests: [
      {
        id: "EXP-REQ-001",
        caseId: "CASE-2026-001",
        caseNumber: "CASE-2026-001",
        customerName: "AeroTech Solutions SAS",
        domain: "CYBERSECURITY_FIREWALL",
        priority: "HIGH",
        status: "IN_PROGRESS",
        requestedByUserId: "USR-COMM-01",
        requestedByUserName: "Alexandre Martin",
        assignedExpertUserId: "USR-EXP-SEC-01",
        assignedExpertUserName: "Dr. Karim Benali",
        questionTitle: "Firewall Throughput Sizing for 65 Users with SSL Deep Inspection",
        questionDetail: "Customer requires full SSL Deep Inspection for 65 users at HQ with 1Gbps symmetrical FTTO link. Need confirmation if FortiGate 70F is sufficient or if 80F/100F is mandatory for sustained SSL throughput.",
        requestedDeadline: "2026-10-02T18:00:00Z",
        createdAt: "2026-09-26T10:00:00Z",
        updatedAt: "2026-09-27T14:00:00Z",
        response: {
          respondedAt: "2026-09-27T15:30:00Z",
          expertUserId: "USR-EXP-SEC-01",
          expertUserName: "Dr. Karim Benali",
          clientSafeRecommendation: "FortiGate 70F with dedicated CP9 hardware acceleration is fully qualified for 65 concurrent users with SSL Deep Inspection at ~800Mbps. Include FortiCare Enterprise 36-month subscription.",
          internalNotes: "CONFIDENTIAL SECURITY NOTE: Customer has sensitive CAD designs transferred via IPsec to Toulouse site. FortiGate 70F achieves 6.5Gbps IPsec VPN throughput, perfectly covering the 1Gbps line. No need to over-dimension to 100F unless employee count exceeds 120.",
          suggestedBomItems: [
            {
              productCode: "SEC-PROD-FW-NG70F",
              productName: "Next-Gen Firewall Appliance (FortiGate 70F) + 3-Yr UTM Protection",
              quantity: 1,
              unit: "unit",
              reason: "Hardware UTM appliance with SSL inspection ASIC",
              capexEur: 1450,
              opexMonthlyEur: 65
            }
          ],
          technicalRisks: [
            "Need to distribute Root CA certificate to all managed workstations via Intune/GPO for transparent SSL inspection."
          ]
        }
      }
    ],
    bomItems: [
      {
        id: "BOM-001",
        domain: "NETWORK_SDWAN",
        productCode: "WAN-PROD-FTTO-1GBPS",
        productName: "Dedicated Symmetrical FTTO Fiber 1Gbps / 1Gbps (GTR 4h 24/7)",
        category: "CONNECTIVITY",
        quantity: 2,
        unit: "site",
        capexUnitEur: 450,
        opexMonthlyUnitEur: 390,
        capexTotalEur: 900,
        opexMonthlyTotalEur: 780,
        mandatory: true,
        source: "AUTO_QUALIFICATION",
        ruleCitation: "RULE-WAN-FTTO-01"
      },
      {
        id: "BOM-002",
        domain: "TELEPHONY",
        productCode: "TEL-PROD-CLOUDPBX-LIC",
        productName: "Cloud PBX Enterprise User License",
        category: "LICENSE",
        quantity: 45,
        unit: "user",
        capexUnitEur: 0,
        opexMonthlyUnitEur: 14.90,
        capexTotalEur: 0,
        opexMonthlyTotalEur: 670.50,
        mandatory: true,
        source: "AUTO_QUALIFICATION",
        ruleCitation: "RULE-TEL-ISDN-01"
      },
      {
        id: "BOM-003",
        domain: "CYBERSECURITY_FIREWALL",
        productCode: "SEC-PROD-FW-NG70F",
        productName: "Next-Gen Firewall Appliance (FortiGate 70F) + 3-Yr UTM Protection",
        category: "HARDWARE",
        quantity: 2,
        unit: "unit",
        capexUnitEur: 1450,
        opexMonthlyUnitEur: 65,
        capexTotalEur: 2900,
        opexMonthlyTotalEur: 130,
        mandatory: true,
        source: "EXPERT_RECOMMENDATION",
        expertJustification: "Expert recommendation by Dr. Karim Benali (CP9 hardware SSL inspection)"
      }
    ],
    offers: [
      {
        id: "OFF-001",
        caseId: "CASE-2026-001",
        version: 1,
        status: "DRAFT",
        title: "Proposition Commerciale & Technique Globale - FTTO + Cloud PBX + Sécurité Fortinet",
        summaryExecutive: "Modernisation complète des télécoms AeroTech Solutions: raccordement Fibre Dédiée 1Gbps symétrique sur les 2 sites, migration Cloud PBX de 45 postes avec téléphonie fixe et mobile unifiée, et sécurisation Next-Gen Firewall Fortinet.",
        technicalAssumptions: [
          "GTR 4h contractuelle 24/7 garantie sur les accès FTTO",
          "Portabilité des 45 numéros SDA existants vers le Trunk SIP",
          "Déploiement du certificat racine SSL sur le parc PC client"
        ],
        totalCapexEur: 3800,
        totalMonthlyOpexEur: 1580.50,
        contractTermMonths: 36,
        createdAt: "2026-09-28T09:00:00Z"
      }
    ],
    documents: [
      {
        id: "DOC-001",
        caseId: "CASE-2026-001",
        filename: "aerotech_cahier_des_charges_telecom_2026.pdf",
        originalFilename: "Cahier_des_Charges_Telecom_AeroTech.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1485200,
        uploadedByUserId: "USR-COMM-01",
        uploadedByUserName: "Alexandre Martin",
        uploadedAt: "2026-09-26T09:30:00Z",
        scanStatus: "CLEAN",
        extractionStatus: "VALIDATED"
      }
    ],
    createdAt: "2026-09-26T09:15:00Z",
    updatedAt: "2026-09-28T11:00:00Z"
  }
];
