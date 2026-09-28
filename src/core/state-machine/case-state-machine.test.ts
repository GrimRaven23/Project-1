import { describe, it, expect } from "vitest";
import { CaseStateMachine } from "./case-state-machine";
import { SolutionCase } from "../domain/types";
import { SEED_CASES } from "../storage/seed-data";

describe("Case State Machine & Lifecycle Guards", () => {
  it("should allow valid forward transitions by authorized commercial user", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    testCase.lifecycleState = "INTAKE_IN_PROGRESS";

    const validation = CaseStateMachine.validateTransition(
      testCase,
      "QUALIFICATION_IN_PROGRESS",
      "COMMERCIAL_AGENT"
    );
    expect(validation.valid).toBe(true);
  });

  it("should reject illegal state transitions", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    testCase.lifecycleState = "DRAFT";

    const validation = CaseStateMachine.validateTransition(
      testCase,
      "APPROVED",
      "COMMERCIAL_AGENT"
    );
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("Illegal state transition");
  });

  it("should prevent Commercial Agent from approving commercial offers without manager role", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    testCase.lifecycleState = "INTERNAL_REVIEW";

    const validation = CaseStateMachine.validateTransition(
      testCase,
      "APPROVED",
      "COMMERCIAL_AGENT"
    );
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("Only Commercial Managers or Admins");
  });

  it("should allow Commercial Manager to approve commercial offers", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    testCase.lifecycleState = "INTERNAL_REVIEW";

    const validation = CaseStateMachine.validateTransition(
      testCase,
      "APPROVED",
      "COMMERCIAL_MANAGER"
    );
    expect(validation.valid).toBe(true);
  });
});
