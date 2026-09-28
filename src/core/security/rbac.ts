/**
 * RBAC (Role-Based Access Control) Policy Engine
 * Enforces least-privilege security across resources and telecom domains.
 */

import { UserRole, TelecomDomain } from "../domain/types";

export type Permission =
  // Customers & Sites
  | "customers:view"
  | "customers:create"
  | "customers:update"
  | "customers:delete"
  // Cases & LifeCycle
  | "cases:view_assigned"
  | "cases:view_all"
  | "cases:create"
  | "cases:update"
  | "cases:transition_state"
  // Dynamic Questionnaire
  | "questionnaire:view"
  | "questionnaire:edit"
  | "questionnaire:submit"
  // Qualification Engine
  | "qualification:run"
  | "qualification:view"
  | "qualification:manage_rules"
  // Expert Requests & Notes
  | "expert_requests:create"
  | "expert_requests:view_queue"
  | "expert_requests:claim"
  | "expert_requests:respond"
  | "expert_notes:view_confidential" // SECURITY_SENSITIVE
  // Catalog & Products
  | "catalog:view"
  | "catalog:manage"
  // Bill of Materials (BOM)
  | "bom:view"
  | "bom:edit"
  | "bom:expert_contribute"
  // Commercial Offers
  | "offers:view"
  | "offers:create"
  | "offers:approve" // Commercial Manager only
  // Documents
  | "documents:upload"
  | "documents:download"
  | "documents:validate_extraction"
  // Audit & Administration
  | "audit:view"
  | "admin:manage_users"
  | "admin:system_config";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "customers:view", "customers:create", "customers:update", "customers:delete",
    "cases:view_assigned", "cases:view_all", "cases:create", "cases:update", "cases:transition_state",
    "questionnaire:view", "questionnaire:edit", "questionnaire:submit",
    "qualification:run", "qualification:view", "qualification:manage_rules",
    "expert_requests:create", "expert_requests:view_queue", "expert_requests:claim", "expert_requests:respond",
    "expert_notes:view_confidential",
    "catalog:view", "catalog:manage",
    "bom:view", "bom:edit", "bom:expert_contribute",
    "offers:view", "offers:create", "offers:approve",
    "documents:upload", "documents:download", "documents:validate_extraction",
    "audit:view", "admin:manage_users", "admin:system_config"
  ],

  PLATFORM_ADMIN: [
    "customers:view", "customers:create", "customers:update",
    "cases:view_assigned", "cases:view_all", "cases:create", "cases:update", "cases:transition_state",
    "questionnaire:view", "questionnaire:edit", "questionnaire:submit",
    "qualification:run", "qualification:view", "qualification:manage_rules",
    "expert_requests:create", "expert_requests:view_queue",
    "catalog:view", "catalog:manage",
    "bom:view", "bom:edit",
    "offers:view", "offers:create",
    "documents:upload", "documents:download", "documents:validate_extraction",
    "audit:view", "admin:manage_users", "admin:system_config"
  ],

  COMMERCIAL_AGENT: [
    "customers:view", "customers:create", "customers:update",
    "cases:view_assigned", "cases:create", "cases:update", "cases:transition_state",
    "questionnaire:view", "questionnaire:edit", "questionnaire:submit",
    "qualification:run", "qualification:view",
    "expert_requests:create",
    "catalog:view",
    "bom:view",
    "offers:view", "offers:create",
    "documents:upload", "documents:download", "documents:validate_extraction"
  ],

  COMMERCIAL_MANAGER: [
    "customers:view", "customers:create", "customers:update",
    "cases:view_assigned", "cases:view_all", "cases:create", "cases:update", "cases:transition_state",
    "questionnaire:view", "questionnaire:edit", "questionnaire:submit",
    "qualification:run", "qualification:view",
    "expert_requests:create", "expert_requests:view_queue",
    "catalog:view",
    "bom:view", "bom:edit",
    "offers:view", "offers:create", "offers:approve",
    "documents:upload", "documents:download", "documents:validate_extraction",
    "audit:view"
  ],

  PRESALES_ENGINEER: [
    "customers:view",
    "cases:view_assigned", "cases:view_all", "cases:update", "cases:transition_state",
    "questionnaire:view", "questionnaire:edit",
    "qualification:run", "qualification:view",
    "expert_requests:view_queue", "expert_requests:claim", "expert_requests:respond",
    "expert_notes:view_confidential",
    "catalog:view",
    "bom:view", "bom:edit", "bom:expert_contribute",
    "offers:view", "offers:create",
    "documents:upload", "documents:download", "documents:validate_extraction"
  ],

  NETWORK_EXPERT: [
    "customers:view",
    "cases:view_assigned",
    "questionnaire:view",
    "qualification:run", "qualification:view",
    "expert_requests:view_queue", "expert_requests:claim", "expert_requests:respond",
    "expert_notes:view_confidential",
    "catalog:view",
    "bom:view", "bom:expert_contribute",
    "documents:download"
  ],

  TELEPHONY_EXPERT: [
    "customers:view",
    "cases:view_assigned",
    "questionnaire:view",
    "qualification:run", "qualification:view",
    "expert_requests:view_queue", "expert_requests:claim", "expert_requests:respond",
    "expert_notes:view_confidential",
    "catalog:view",
    "bom:view", "bom:expert_contribute",
    "documents:download"
  ],

  SECURITY_EXPERT: [
    "customers:view",
    "cases:view_assigned",
    "questionnaire:view",
    "qualification:run", "qualification:view",
    "expert_requests:view_queue", "expert_requests:claim", "expert_requests:respond",
    "expert_notes:view_confidential",
    "catalog:view",
    "bom:view", "bom:expert_contribute",
    "documents:download"
  ],

  OPERATIONS_PROVISIONING: [
    "customers:view",
    "cases:view_assigned", "cases:view_all",
    "questionnaire:view",
    "qualification:view",
    "catalog:view",
    "bom:view",
    "offers:view",
    "documents:download"
  ],

  AUDITOR_COMPLIANCE: [
    "customers:view",
    "cases:view_all",
    "questionnaire:view",
    "qualification:view",
    "expert_notes:view_confidential",
    "catalog:view",
    "bom:view",
    "offers:view",
    "documents:download",
    "audit:view"
  ]
};

export class RbacGuard {
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  static canAccessDomainExpertise(role: UserRole, domain: TelecomDomain): boolean {
    if (role === "SUPER_ADMIN" || role === "PRESALES_ENGINEER" || role === "PLATFORM_ADMIN") return true;
    if (domain === "TELEPHONY" && role === "TELEPHONY_EXPERT") return true;
    if ((domain === "NETWORK_SDWAN" || domain === "WIFI") && role === "NETWORK_EXPERT") return true;
    if (domain === "CYBERSECURITY_FIREWALL" && role === "SECURITY_EXPERT") return true;
    return false;
  }
}
