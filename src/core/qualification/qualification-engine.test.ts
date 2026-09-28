import { describe, it, expect } from "vitest";
import { QualificationEngine } from "./qualification-engine";
import { SolutionCase } from "../domain/types";
import { SEED_CASES } from "../storage/seed-data";

describe("Qualification Engine Deterministic Evaluation", () => {
  it("should evaluate legacy ISDN T0/T2 line and trigger cloud PBX migration recommendation", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    testCase.questionnaire.hasLegacyIsdnT0T2 = true;

    const result = QualificationEngine.evaluateCase(testCase);
    expect(result).toBeDefined();

    const isdnRule = result.items.find((i) => i.ruleCode === "RULE-TEL-ISDN-01");
    expect(isdnRule).toBeDefined();
    expect(isdnRule?.status).toBe("REPLACEMENT_RECOMMENDED");
    expect(isdnRule?.suggestedCatalogItemId).toBe("TEL-PROD-CLOUDPBX-LIC");
  });

  it("should qualify for Dedicated FTTO Fiber when 4h GTR and symmetrical bandwidth is required", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    testCase.questionnaire.isSymmetricalRequired = true;
    testCase.questionnaire.gtrRequiredHours = 4;

    const result = QualificationEngine.evaluateCase(testCase);
    const fttoRule = result.items.find((i) => i.ruleCode === "RULE-WAN-FTTO-01");
    expect(fttoRule).toBeDefined();
    expect(fttoRule?.status).toBe("AVAILABLE");
    expect(fttoRule?.suggestedCatalogItemId).toBe("WAN-PROD-FTTO-1GBPS");
  });

  it("should trigger expert escalation when SSL deep packet inspection is requested for 65+ users", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    testCase.questionnaire.requiredSecurityCapabilities = ["SSL_DEEP_INSPECTION"];

    const result = QualificationEngine.evaluateCase(testCase);
    const sslRule = result.items.find((i) => i.ruleCode === "RULE-SEC-SSL-THROUGHPUT-03");
    expect(sslRule).toBeDefined();
    expect(sslRule?.requiresExpertEscalation).toBe(true);
    expect(result.expertEscalationsNeeded).toContain("CYBERSECURITY_FIREWALL");
  });

  it("should generate structured BOM items from qualified rules", () => {
    const testCase: SolutionCase = JSON.parse(JSON.stringify(SEED_CASES[0]));
    const result = QualificationEngine.evaluateCase(testCase);
    const bomItems = QualificationEngine.generateSuggestedBomItems(testCase, result);

    expect(bomItems.length).toBeGreaterThan(0);
    expect(bomItems.some((b) => b.category === "CONNECTIVITY")).toBe(true);
    expect(bomItems.some((b) => b.category === "LICENSE")).toBe(true);
  });
});
