/**
 * Case State Machine & Lifecycle Transition Engine
 * Defines valid lifecycle transitions, prerequisites, and permission guards.
 */

import { CaseLifecycleState, SolutionCase, UserRole } from "../domain/types";
import { RbacGuard } from "../security/rbac";

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

export const VALID_TRANSITIONS: Record<CaseLifecycleState, CaseLifecycleState[]> = {
  DRAFT: ["INTAKE_IN_PROGRESS", "CANCELLED"],
  INTAKE_IN_PROGRESS: ["INFORMATION_REQUIRED", "QUALIFICATION_IN_PROGRESS", "CANCELLED"],
  INFORMATION_REQUIRED: ["INTAKE_IN_PROGRESS", "QUALIFICATION_IN_PROGRESS", "CANCELLED"],
  QUALIFICATION_IN_PROGRESS: [
    "EXPERT_REVIEW_REQUIRED",
    "QUALIFICATION_COMPLETE",
    "INFORMATION_REQUIRED",
    "CANCELLED"
  ],
  EXPERT_REVIEW_REQUIRED: ["EXPERT_REVIEW_IN_PROGRESS", "CANCELLED"],
  EXPERT_REVIEW_IN_PROGRESS: [
    "QUALIFICATION_COMPLETE",
    "INFORMATION_REQUIRED",
    "EXPERT_REVIEW_REQUIRED",
    "CANCELLED"
  ],
  QUALIFICATION_COMPLETE: ["SOLUTION_READY", "QUALIFICATION_IN_PROGRESS", "CANCELLED"],
  SOLUTION_READY: ["OFFER_PREPARATION", "QUALIFICATION_IN_PROGRESS", "CANCELLED"],
  OFFER_PREPARATION: ["INTERNAL_REVIEW", "SOLUTION_READY", "CANCELLED"],
  INTERNAL_REVIEW: ["APPROVED", "OFFER_PREPARATION", "CANCELLED"],
  APPROVED: ["SENT_TO_CUSTOMER", "OFFER_PREPARATION", "CANCELLED"],
  SENT_TO_CUSTOMER: ["WON", "LOST", "CANCELLED"],
  WON: [],
  LOST: [],
  CANCELLED: []
};

export class CaseStateMachine {
  /**
   * Evaluates if a proposed state transition is valid and authorized
   */
  static validateTransition(
    currentCase: SolutionCase,
    targetState: CaseLifecycleState,
    actorRole: UserRole
  ): TransitionValidationResult {
    // 1. Permission check
    if (!RbacGuard.hasPermission(actorRole, "cases:transition_state")) {
      return { valid: false, reason: `Role ${actorRole} does not have permission to transition case states.` };
    }

    // 2. Check if target state is a valid transition from current state
    const allowed = VALID_TRANSITIONS[currentCase.lifecycleState] || [];
    if (!allowed.includes(targetState)) {
      return {
        valid: false,
        reason: `Illegal state transition from ${currentCase.lifecycleState} to ${targetState}.`
      };
    }

    // 3. Business rule guards
    if (targetState === "QUALIFICATION_COMPLETE") {
      // Guard: If there are open/unresolved expert requests, cannot complete qualification
      const openExpertRequests = (currentCase.expertRequests || []).filter(
        (req) => req.status !== "COMPLETED" && req.status !== "REJECTED"
      );
      if (openExpertRequests.length > 0) {
        return {
          valid: false,
          reason: `Cannot complete qualification: ${openExpertRequests.length} specialist expert request(s) are still unresolved.`
        };
      }
    }

    if (targetState === "APPROVED") {
      // Guard: Only Commercial Managers and Super Admins can approve commercial offers
      if (!RbacGuard.hasPermission(actorRole, "offers:approve")) {
        return {
          valid: false,
          reason: `Only Commercial Managers or Admins can give final offer approval.`
        };
      }
    }

    return { valid: true };
  }
}
