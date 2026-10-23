# TelcoQualify Enterprise — CI/CD Pipeline Audit

> **Audit Date:** October 23, 2026  
> **Post-Remediation Update:** October 23, 2026  
> **Auditor Role:** DevSecOps & QA Engineering Lead  
>
> **Note:** §1–§2 record the **inherited state**; the repair status and the
> remaining gaps are in §3 (commit `4ea8dc4`, `e661575`, `d788ba9`).

---

## 1. Executive Summary

The project repository includes 4 GitHub Actions workflow definitions in `.github/workflows/`:
1. `ci.yml` — Pull Request & Push Quality Gate
2. `security.yml` — SAST, Secret Scanning & Vulnerability Analysis
3. `daily-security.yml` — Nightly Automated Dependency Vulnerability Audit
4. `release.yml` — Docker Containerization & SBOM Release Automation

**Audit Finding:** 3 out of the 4 workflows currently fail when executed against a clean checkout:
- **`ci.yml` fails** at step `npm run lint` due to missing `.eslintrc.json`.
- **`daily-security.yml` fails** with exit code 1 because `npm audit --audit-level=high` detects 10 high/critical CVEs.
- **`release.yml` fails** during `docker/build-push-action` because `Dockerfile` tries to copy `/app/public` which does not exist in the repository.

**Critical additional finding (raised during remediation, later refined):** the local working copy had been left on a local-only `master` branch with no remote, so locally nothing could trigger at all — while `develop` never existed on GitHub either. **Verified against the GitHub API during the pre-push check (2026-10-23):** the public repo's default branch is `main`, and gates *had* executed there — CI Quality Gate **failed 3/3 runs**, Security & SAST Pipeline **passed 3/3** (only because Trivy was non-gating), and the daily audit **failed 25/25 runs** since 2026-09-29. The corrected remediation therefore targets **`main`**, not `master`. (See §3.)

---

## 2. Detailed Workflow Analysis

### Workflow 1: CI Quality Gate (`.github/workflows/ci.yml`)
- **Purpose:** Primary pull request verification gate (Lint, Typecheck, Test, Build).
- **Triggers:** Push & Pull Request to `main` and `develop`.
- **Concurrency:** Grouped with `cancel-in-progress: true`.
- **Permissions:** `contents: read`, `pull-requests: write`.
- **Current Execution Status:** ❌ **FAILS**
- **Root Cause:**
  - `npm run lint` invokes `next lint`. Without `.eslintrc.json`, Next.js halts with an interactive prompt asking how to configure ESLint, exiting with code 1.
- **Identified Gaps:**
  - Runs `node scripts/test-runner.mjs` instead of standard Vitest test runner.
  - No end-to-end integration tests.
  - Permissions should be reduced to `contents: read` unless PR comment generation is actively used.
- **Remediation Plan:**
  - Create standard `.eslintrc.json` extending `next/core-web-vitals`.
  - Ensure all commands run non-interactively.

---

### Workflow 2: Security & SAST Pipeline (`.github/workflows/security.yml`)
- **Purpose:** Secret detection (Gitleaks), static analysis (CodeQL), and container/filesystem vulnerability scanning (Trivy).
- **Triggers:** Push & Pull Request to `main`.
- **Permissions:** `contents: read`, `security-events: write`.
- **Current Execution Status:** ⚠️ **CONDITIONAL PASS** (Requires GitHub Advanced Security for SARIF upload on private repositories).
- **Identified Gaps:**
  - Trivy SARIF upload may fail if GitHub Advanced Security is not enabled on private org repos.
  - No DAST or staging security scanning job.
- **Remediation Plan:**
  - Add fallback condition to Trivy so unauthenticated private repos don't fail the pipeline when Advanced Security is unavailable.

---

### Workflow 3: Daily Automated Security Audit (`.github/workflows/daily-security.yml`)
- **Purpose:** Scheduled daily audit of npm dependencies at 04:00 UTC.
- **Triggers:** Schedule (`0 4 * * *`) and `workflow_dispatch`.
- **Current Execution Status:** ❌ **FAILS**
- **Root Cause:**
  - `npm audit --audit-level=high` fails immediately because 16 vulnerabilities exist in `package-lock.json` (7 high, 3 critical).
- **Remediation Plan:**
  - Apply `npm audit fix` / package overrides for vulnerable subdependencies (braces, tinypool, postcss).

---

### Workflow 4: Production Release & SBOM Generation (`.github/workflows/release.yml`)
- **Purpose:** Build Docker container image, generate CycloneDX Software Bill of Materials (SBOM), and create GitHub release.
- **Triggers:** Tag push `v*`.
- **Permissions:** `contents: write`, `packages: write`.
- **Current Execution Status:** ❌ **FAILS**
- **Root Cause:**
  - `docker/Dockerfile` contains `COPY --from=builder /app/public ./public` and `/app/storage`. These directories do not exist in the root repository, causing Docker build failure.
- **Remediation Plan:**
  - Create the required `public/` directory (with standard favicon and robots.txt) and ensure Docker build stages succeed cleanly.

---

## 3. Post-Remediation Status (October 23, 2026)

| Workflow | Before | After | What Changed |
| :--- | :---: | :---: | :--- |
| `ci.yml` | ❌ failing 3/3 on GitHub (missing ESLint) | ✅ **fixed** | Triggers settled on **`main`** (the verified GitHub default branch; the local-only `master` was renamed before pushing) and phantom `develop` dropped; `.eslintrc.json` committed; lint = `eslint . --max-warnings=0`; `npm test` runs **both** suites (26 custom + 30 Vitest) so the previously orphaned Vitest specs actually gate; build step retained; Node 20 (EOL) → 24 (`4ea8dc4`, `d788ba9`, `e661575`) |
| `security.yml` | ⚠️ passing 3/3 but vacuous (Trivy floating `@master`, non-gating) | ✅ **fixed** | Trivy pinned to immutable **`v0.36.0`** (supply-chain hardening) with **`exit-code: '1'`** so CRITICAL/HIGH findings fail the job; accepted-risk entries live in tracked `/.trivyignore`; SARIF still uploaded with `if: always()` (`4ea8dc4`) |
| `daily-security.yml` | ❌ failing 25/25 runs on GitHub (open CVEs) | ✅ **fixed** | Vulnerabilities reduced 14 → 5 (2 critical → 0), then a **new HIGH (zod GHSA-mrhx-c7xc-m3w5, CVE-2023-54404)** was caught by the new gate pre-push and fixed by upgrading zod 3 → 4.6.7. The job now runs `scripts/audit-gate.mjs`: fails on any unaccepted high/critical, tolerating only entries listed with rationale in tracked `/.trivyignore` (raw `npm audit --audit-level=high` cannot express accepted risk — it would fail forever on the documented postcss residual). Node 20 → 24 (`e661575`). |
| `release.yml` | ❌ invalid Dockerfile | ✅ **fixed (statically)** | `public/` + `storage/` tracked, `.dockerignore` populated, builder `NODE_ENV` corrected, compose secrets externalised, Node 24 base (`7a75bc0`, `4ea8dc4`, `e661575`). *Not yet exercised — no tag pushed.* |

**Verification:** all four workflows were validated statically (YAML structure, action versions, command availability) and every command they run was executed locally with green results. The definitive proof is the post-push run: every workflow execution on `main` after the remediation push is observable via the Actions tab (pre-push history: 3 CI failures, 3 vacuous security passes, 25 daily-audit failures).

### Remaining CI/CD Gaps (tracked in `TECHNICAL-DEBT.md`)

1. **No E2E stage** — the Playwright/Integration stages in the original pipeline diagram did not exist; `docs/CI-CD.md` was corrected accordingly (TD-P3-04).
2. **No container image scan** — Trivy scans the filesystem; the release-built image is never scanned (TD-P2-05). Adding `scan-type: image` should precede any registry push.
3. **Docker build not in PR CI** — Dockerfile regressions only surface on tag pushes (TD-P2-05).
4. **SARIF upload requires GitHub Advanced Security on private repos** — this repository is public, so code-scanning upload works for free; if it is ever made private without GHAS, gate the upload step on `github.advanced_security.enabled` rather than weakening the scan itself.
5. **Post-push green confirmation** — the remediated workflows must be watched on their first execution after the push; badges activate then (TD-P3-09).
