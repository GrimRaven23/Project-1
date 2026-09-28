/**
 * Standalone Zero-Dependency Test Suite Runner
 * Executes all qualification, state machine, and RBAC test suites natively.
 */

import { QualificationEngine } from "../src/core/qualification/qualification-engine.ts";
import { CaseStateMachine } from "../src/core/state-machine/case-state-machine.ts";
import { RbacGuard } from "../src/core/security/rbac.ts";
import { DataMaskingService } from "../src/core/security/data-masking.ts";
import { SEED_CASES } from "../src/core/storage/seed-data.ts";

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log("\n🧪 Running TelcoQualify Enterprise Native Test Suite...\n");

// 1. Qualification Engine Tests
console.log("▶ [Domain 1]: Qualification Engine Deterministic Rules");
const testCase1 = JSON.parse(JSON.stringify(SEED_CASES[0]));
testCase1.questionnaire.hasLegacyIsdnT0T2 = true;
const qResult1 = QualificationEngine.evaluateCase(testCase1);
assert(qResult1.items.some(i => i.ruleCode === "RULE-TEL-ISDN-01"), "Rule RULE-TEL-ISDN-01 triggers PBX migration for legacy ISDN T0/T2");

testCase1.questionnaire.isSymmetricalRequired = true;
testCase1.questionnaire.gtrRequiredHours = 4;
const qResult2 = QualificationEngine.evaluateCase(testCase1);
assert(qResult2.items.some(i => i.ruleCode === "RULE-WAN-FTTO-01" && i.status === "AVAILABLE"), "Rule RULE-WAN-FTTO-01 qualifies dedicated FTTO fiber with 4h GTR");

testCase1.questionnaire.requiredSecurityCapabilities = ["SSL_DEEP_INSPECTION"];
const qResult3 = QualificationEngine.evaluateCase(testCase1);
assert(qResult3.expertEscalationsNeeded.includes("CYBERSECURITY_FIREWALL"), "Rule RULE-SEC-SSL-THROUGHPUT-03 escalates SSL Deep Inspection to Security Expert");

const bomItems = QualificationEngine.generateSuggestedBomItems(testCase1, qResult3);
assert(bomItems.length > 0 && bomItems.some(b => b.category === "CONNECTIVITY"), "Qualification generates structured multi-domain BOM items");

// 2. State Machine Tests
console.log("\n▶ [Domain 2]: Case Lifecycle State Machine & Guards");
const testCase2 = JSON.parse(JSON.stringify(SEED_CASES[0]));
testCase2.lifecycleState = "INTAKE_IN_PROGRESS";
const t1 = CaseStateMachine.validateTransition(testCase2, "QUALIFICATION_IN_PROGRESS", "COMMERCIAL_AGENT");
assert(t1.valid === true, "Commercial Agent can advance case from INTAKE_IN_PROGRESS to QUALIFICATION_IN_PROGRESS");

const t2 = CaseStateMachine.validateTransition(testCase2, "APPROVED", "COMMERCIAL_AGENT");
assert(t2.valid === false, "Illegal leap from INTAKE_IN_PROGRESS directly to APPROVED is blocked");

testCase2.lifecycleState = "INTERNAL_REVIEW";
const t3 = CaseStateMachine.validateTransition(testCase2, "APPROVED", "COMMERCIAL_AGENT");
assert(t3.valid === false, "Commercial Agent is blocked from signing off commercial offer approval");

const t4 = CaseStateMachine.validateTransition(testCase2, "APPROVED", "COMMERCIAL_MANAGER");
assert(t4.valid === true, "Commercial Manager can sign off commercial offer approval");

// 3. RBAC & Data Masking Tests
console.log("\n▶ [Domain 3]: RBAC & Field-Level Data Masking");
assert(RbacGuard.hasPermission("COMMERCIAL_AGENT", "cases:create") === true, "Commercial Agent has case creation permission");
assert(RbacGuard.hasPermission("COMMERCIAL_AGENT", "expert_notes:view_confidential") === false, "Commercial Agent denied access to confidential expert notes");
assert(RbacGuard.hasPermission("SECURITY_EXPERT", "expert_notes:view_confidential") === true, "Security Expert has access to confidential notes");

const testCase3 = JSON.parse(JSON.stringify(SEED_CASES[0]));
const maskedCommercial = DataMaskingService.maskCase(testCase3, "COMMERCIAL_AGENT");
assert(maskedCommercial.expertRequests[0]?.response?.internalNotes.includes("[REDACTED"), "DataMaskingService strips confidential notes for Commercial persona");

const maskedSecurity = DataMaskingService.maskCase(testCase3, "SECURITY_EXPERT");
assert(maskedSecurity.expertRequests[0]?.response?.internalNotes.includes("CONFIDENTIAL SECURITY NOTE"), "DataMaskingService preserves confidential notes for Security Expert persona");

console.log(`\n========================================`);
console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
