/**
 * Data Masking & Field-Level Security Serializer
 * Strips confidential technical notes and sensitive fields based on user role.
 */

import { SolutionCase, ExpertRequest, UserRole } from "../domain/types";
import { RbacGuard } from "./rbac";

export class DataMaskingService {
  /**
   * Sanitizes a SolutionCase for presentation to the requesting user
   */
  static maskCase(solutionCase: SolutionCase, userRole: UserRole): SolutionCase {
    const canViewConfidentialNotes = RbacGuard.hasPermission(userRole, "expert_notes:view_confidential");

    // Deep clone to prevent mutation
    const sanitizedCase: SolutionCase = JSON.parse(JSON.stringify(solutionCase));

    if (!canViewConfidentialNotes && sanitizedCase.expertRequests) {
      sanitizedCase.expertRequests = sanitizedCase.expertRequests.map((req) =>
        this.maskExpertRequest(req, userRole)
      );
    }

    return sanitizedCase;
  }

  /**
   * Sanitizes a single ExpertRequest
   */
  static maskExpertRequest(request: ExpertRequest, userRole: UserRole): ExpertRequest {
    const canViewConfidentialNotes = RbacGuard.hasPermission(userRole, "expert_notes:view_confidential");
    const sanitized: ExpertRequest = JSON.parse(JSON.stringify(request));

    if (!canViewConfidentialNotes && sanitized.response) {
      sanitized.response.internalNotes = "[REDACTED: RESTRICTED TO DOMAIN SPECIALISTS & AUDITORS]";
    }

    return sanitized;
  }
}
