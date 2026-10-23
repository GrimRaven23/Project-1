#!/usr/bin/env node
/**
 * npm audit gate with an explicit accepted-advisory list.
 *
 * Runs `npm audit --json` and fails (exit 1) if ANY advisory of severity
 * high/critical remains that is not listed in /.trivyignore.
 * `.trivyignore` is the single source of accepted risk, shared with the
 * Trivy scan in security.yml, so both security gates agree on what is
 * deliberately tolerated and both still fail on anything NEW.
 *
 * Rationale for accepted entries: docs/audits/SECURITY-AUDIT.md §4.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ignoreFile = join(root, ".trivyignore");

const accepted = existsSync(ignoreFile)
  ? readFileSync(ignoreFile, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
  : [];

let raw;
try {
  raw = execSync("npm audit --json", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (err) {
  // npm audit exits non-zero when vulnerabilities exist; JSON is still on stdout.
  raw = err.stdout?.toString?.() ?? "";
}

if (!raw.trim()) {
  console.error("audit-gate: no JSON output from npm audit — treating as failure.");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(raw.replace(/^\uFEFF/, ""));
} catch {
  console.error("audit-gate: could not parse npm audit JSON — treating as failure.");
  process.exit(1);
}

const advisories = report.vulnerabilities ?? {};
const blocking = [];
const tolerated = [];

for (const [name, v] of Object.entries(advisories)) {
  if (v.severity !== "high" && v.severity !== "critical") continue;
  // Collect the advisory IDs (GitHub IDs) for this package's findings.
  const ids = (v.via ?? [])
    .map((x) => (typeof x === "object" && x ? x.url : null))
    .filter(Boolean)
    .map((u) => (u.match(/GHSA-[\w-]+$/) || [])[0])
    .filter(Boolean);
  const directIds = ids.length ? ids : [];
  const isAccepted =
    ids.length > 0 && ids.every((id) => accepted.includes(id));
  const label = `${v.severity.toUpperCase()} ${name} ${directIds.length ? `[${directIds.join(", ")}]` : "(no GHSA id)"}`;
  if (isAccepted) tolerated.push(label);
  else blocking.push(label);
}

const counts = report.metadata?.vulnerabilities ?? {};
console.log(`audit-gate: npm audit reports ${counts.total ?? "?"} findings (critical=${counts.critical ?? 0}, high=${counts.high ?? 0}, moderate=${counts.moderate ?? 0}, low=${counts.low ?? 0})`);
if (tolerated.length) {
  console.log("audit-gate: accepted by /.trivyignore (docs/audits/SECURITY-AUDIT.md §4):");
  for (const t of tolerated) console.log(`  - ${t}`);
}

if (blocking.length) {
  console.error("audit-gate: FAIL — unaccepted high/critical advisories:");
  for (const b of blocking) console.error(`  - ${b}`);
  console.error("audit-gate: fix them, or document + add to /.trivyignore with rationale.");
  process.exit(1);
}

console.log("audit-gate: PASS — no unaccepted high/critical advisories.");
