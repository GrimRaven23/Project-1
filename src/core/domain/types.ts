/**
 * TelcoQualify Enterprise Core Domain Types
 * Defines the complete type system for Telecom Presales & Qualification
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "COMMERCIAL_AGENT"
  | "COMMERCIAL_MANAGER"
  | "PRESALES_ENGINEER"
  | "NETWORK_EXPERT"
  | "TELEPHONY_EXPERT"
  | "SECURITY_EXPERT"
  | "OPERATIONS_PROVISIONING"
  | "AUDITOR_COMPLIANCE";

export type InformationClassification =
  | "PUBLIC"
  | "INTERNAL"
  | "CUSTOMER_CONFIDENTIAL"
  | "RESTRICTED"
  | "SECURITY_SENSITIVE";

export type TelecomDomain =
  | "TELEPHONY"
  | "NETWORK_SDWAN"
  | "WIFI"
  | "CYBERSECURITY_FIREWALL"
  | "SOLUTIONS_ARCHITECT";

export type CaseLifecycleState =
  | "DRAFT"
  | "INTAKE_IN_PROGRESS"
  | "INFORMATION_REQUIRED"
  | "QUALIFICATION_IN_PROGRESS"
  | "EXPERT_REVIEW_REQUIRED"
  | "EXPERT_REVIEW_IN_PROGRESS"
  | "QUALIFICATION_COMPLETE"
  | "SOLUTION_READY"
  | "OFFER_PREPARATION"
  | "INTERNAL_REVIEW"
  | "APPROVED"
  | "SENT_TO_CUSTOMER"
  | "WON"
  | "LOST"
  | "CANCELLED";

export type PriorityLevel = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  sirenOrVat: string;
  industrySegment: "SMB" | "PME" | "PMI" | "ENTERPRISE" | "PUBLIC_SECTOR";
  accountManagerId: string;
  accountManagerName: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  customerId: string;
  siteName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  buildingType: "OFFICE_HQ" | "BRANCH_OFFICE" | "WAREHOUSE" | "RETAIL_STORE" | "DATA_CENTER";
  floorsCount: number;
  areaSquareMeters: number;
  totalStaffCount: number;
  areas: {
    smallOfficesCount: number; // <= 40 m2
    corridorsLinearMeters: number;
    meetingRoomsCount: number; // >= 12 seats
    largeOpenSpacesCount: number; // >= 150 m2
  };
}

export type AssetCategory =
  | "FIREWALL"
  | "ROUTER"
  | "SWITCH"
  | "PBX"
  | "SIP_TRUNK"
  | "WIFI_AP"
  | "INTERNET_LINK"
  | "LICENSE";

export type AssetLicenseStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "UNLICENSED";

export interface ExistingAsset {
  id: string;
  customerId: string;
  siteId: string;
  siteName?: string;
  category: AssetCategory;
  domain: TelecomDomain;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  installYear: number;
  warrantyExpiryDate?: string;
  licenseStatus: AssetLicenseStatus;
  currentCapacityOrBandwidth: string;
  notes?: string;
  deltaStatus?: "KEEP_AS_IS" | "RENEW" | "UPGRADE" | "REPLACE" | "INCOMPATIBLE" | "EXPERT_REVIEW_REQUIRED";
}

export interface DynamicQuestionnaireAnswer {
  // Telephony
  telephonyEndpointsCount: number;
  telephonyCategory: "BASIC" | "STANDARD" | "PREMIUM" | "MIXED";
  telephonyBreakdown: {
    executiveCount: number;
    standardCount: number;
    receptionistCount: number;
    softphoneOnlyCount: number;
  };
  hasLegacyIsdnT0T2: boolean;
  hasExistingSipTrunk: boolean;
  desiredTelephonyFeatures: string[]; // e.g. ["CALL_RECORDING", "IVR_AUTO_ATTENDANT", "TEAMS_INTEGRATION", "MOBILE_APP"]
  telephonyAction: "RENEW" | "MIGRATE_CLOUD" | "EXPAND" | "REPLACE_ALL";

  // Internet & WAN
  internetStatus: "NO_LINK" | "COPPER_ADSL_VDSL" | "SHARED_FTTH" | "DEDICATED_FTTO" | "MULTI_LINK";
  existingBandwidthDownMbps: number;
  existingBandwidthUpMbps: number;
  desiredBandwidthDownMbps: number;
  desiredBandwidthUpMbps: number;
  isSymmetricalRequired: boolean;
  gtrRequiredHours: 4 | 8 | 24 | 48; // Guaranteed Time to Repair
  requiresCellularBackup: boolean;
  requiresMultiSiteSdWan: boolean;

  // Wi-Fi
  wifiCoverageRequired: boolean;
  wifiDesiredFeatures: string[]; // e.g. ["WIFI_6", "CAPTIVE_PORTAL", "CODE_SMS_AUTH", "VLAN_SEGREGATION", "HEATMAP_SURVEY"]
  wifiOutdoorRequired: boolean;

  // Security & Firewall
  hasExistingFirewall: boolean;
  existingFirewallModel?: string;
  firewallAgeYears: number;
  firewallLicenseValid: boolean;
  requiredSecurityCapabilities: string[]; // e.g. ["ANTIVIRUS_IPS", "SSL_DEEP_INSPECTION", "APPLICATION_CONTROL", "IPSEC_VPN", "WEB_FILTERING"]
  concurrentVpnUsersNeeded: number;
  requiresCaptivePortal: boolean;
  securityComplianceRequirement?: string;
}

export type QualificationStatus =
  | "AVAILABLE"
  | "POTENTIALLY_AVAILABLE"
  | "UNAVAILABLE"
  | "REQUIRES_EXPERT_VALIDATION"
  | "MISSING_INFORMATION"
  | "INCOMPATIBLE"
  | "REPLACEMENT_RECOMMENDED"
  | "RENEWAL_REQUIRED"
  | "ADDITIONAL_EQUIPMENT_REQUIRED"
  | "ALTERNATIVE_SOLUTION_AVAILABLE";

export interface QualificationItem {
  id: string;
  domain: TelecomDomain;
  title: string;
  status: QualificationStatus;
  ruleCode: string;
  explanation: {
    en: string;
    fr: string;
  };
  suggestedAction: {
    en: string;
    fr: string;
  };
  requiresExpertEscalation: boolean;
  suggestedCatalogItemId?: string;
  suggestedQuantity?: number;
}

export interface QualificationResult {
  evaluatedAt: string;
  overallEligibility: "ELIGIBLE" | "REQUIRES_REVIEW" | "INELIGIBLE";
  items: QualificationItem[];
  missingInformationFlags: string[];
  expertEscalationsNeeded: TelecomDomain[];
  summary: {
    en: string;
    fr: string;
  };
}

export interface ExpertRequest {
  id: string;
  caseId: string;
  caseNumber: string;
  customerName: string;
  domain: TelecomDomain;
  priority: PriorityLevel;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "CLARIFICATION_REQUESTED" | "COMPLETED" | "REJECTED";
  requestedByUserId: string;
  requestedByUserName: string;
  assignedExpertUserId?: string;
  assignedExpertUserName?: string;
  questionTitle: string;
  questionDetail: string;
  requestedDeadline: string;
  createdAt: string;
  updatedAt: string;
  
  // Responses
  response?: {
    respondedAt: string;
    expertUserId: string;
    expertUserName: string;
    clientSafeRecommendation: string;
    internalNotes: string; // SECURITY_SENSITIVE! Stripped for commercial agents
    suggestedBomItems: Array<{
      productCode: string;
      productName: string;
      quantity: number;
      unit: string;
      reason: string;
      capexEur: number;
      opexMonthlyEur: number;
    }>;
    technicalRisks: string[];
    technicalAlternatives?: string;
  };
}

export interface BomItem {
  id: string;
  domain: TelecomDomain;
  productCode: string;
  productName: string;
  category: "HARDWARE" | "CONNECTIVITY" | "LICENSE" | "SERVICE_INSTALL" | "SUPPORT_SLA";
  quantity: number;
  unit: string;
  capexUnitEur: number;
  opexMonthlyUnitEur: number;
  capexTotalEur: number;
  opexMonthlyTotalEur: number;
  mandatory: boolean;
  source: "AUTO_QUALIFICATION" | "EXPERT_RECOMMENDATION" | "MANUAL_COMMERCIAL";
  expertJustification?: string;
  ruleCitation?: string;
}

export interface OfferDraft {
  id: string;
  caseId: string;
  version: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ISSUED";
  title: string;
  summaryExecutive: string;
  technicalAssumptions: string[];
  totalCapexEur: number;
  totalMonthlyOpexEur: number;
  contractTermMonths: 24 | 36 | 48 | 60;
  approvalByManagerId?: string;
  approvalDate?: string;
  createdAt: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedAt: string;
  scanStatus: "CLEAN" | "INFECTED" | "PENDING_SCAN";
  extractionStatus: "NONE" | "EXTRACTED_DRAFT" | "VALIDATED" | "REJECTED";
  extractedDraftData?: Partial<DynamicQuestionnaireAnswer>;
}

export interface AuditLogEntry {
  id: string;
  caseId?: string;
  caseNumber?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  resourceId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  correlationId: string;
  timestamp: string;
}

export interface SolutionCase {
  id: string;
  caseNumber: string;
  customerId: string;
  customer?: Customer;
  title: string;
  assignedCommercialId: string;
  assignedCommercialName: string;
  participatingExpertDomains: TelecomDomain[];
  lifecycleState: CaseLifecycleState;
  priority: PriorityLevel;
  classification: InformationClassification;
  version: number;
  completenessPercentage: number;
  
  // Embedded Domain Sub-structures
  sites: Site[];
  existingAssets: ExistingAsset[];
  questionnaire: DynamicQuestionnaireAnswer;
  qualificationResult?: QualificationResult;
  expertRequests: ExpertRequest[];
  bomItems: BomItem[];
  offers: OfferDraft[];
  documents: CaseDocument[];
  
  createdAt: string;
  updatedAt: string;
}
