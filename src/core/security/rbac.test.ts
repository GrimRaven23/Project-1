import { describe, it, expect } from "vitest";
import { RbacGuard } from "./rbac";
import { DataMaskingService } from "./data-masking";
import { SolutionCase } from "../domain/types";
import { SEED_CASES } from "../storage/seed-data";

describe("RBAC Policy & Field-Level Data Masking", () => {
  it("should grant commercial agents case creation and qualification permissions", () => {
    expect(RbacGuard.hasPermission("COMMERCIAL_AGENT", "cases:create")).toBe(true);
    expect(RbacGuard.hasPermission("COMMERCIAL_AGENT", "qualification:run")).toBe(true);
  });

  it("should deny commercial agents access to confidential specialist notes", () => {
    expect(RbacGuard.hasPermission("COMMERCIAL_AGENT", "expert_notes:view_confidential")).toBe(false);
  });

  it("should grant security experts access to confidential notes and response submission", () => {
    expect(RbacGuard.hasPermission("SECURITY_EXPERT", "expert_notes:view_confidential")).toBe(true);
    expect(RbacGuard.hasPermission("SECURITY_EXPERT", "expert_requests:respond")).toBe(true);
  });

  it("should strip internal confidential notes when masked for Commercial Agent persona", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    expect(testCase.expertRequests[0]?.response?.internalNotes).toContain("CONFIDENTIAL SECURITY NOTE");

    const masked = DataMaskingService.maskCase(testCase, "COMMERCIAL_AGENT");
    expect(masked.expertRequests[0]?.response?.internalNotes).toContain("[REDACTED");
  });

  it("should preserve confidential notes when viewed by Security Expert or Auditor", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    const expertView = DataMaskingService.maskCase(testCase, "SECURITY_EXPERT");
    expect(expertView.expertRequests[0]?.response?.internalNotes).toContain("CONFIDENTIAL SECURITY NOTE");
  });
});
