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

**Critical additional finding (raised during remediation):** beyond failing when run, the gates **could never run at all** — `ci.yml` and `security.yml` triggered on `main`/`develop`, but the repository's only branch is `master`. No quality or security gate had ever executed on any push or PR. (See §3, status per workflow.)

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
| `ci.yml` | ❌ never triggered / failing at lint | ✅ **fixed** | Triggers retargeted `main`/`develop` → **`master`**; `.eslintrc.json` committed; lint = `eslint . --max-warnings=0`; `npm test` runs **both** suites (26 custom + 30 Vitest) so the previously orphaned Vitest specs actually gate; build step retained; Node 20 (EOL) → 24 (`4ea8dc4`, `d788ba9`, `e661575`) |
| `security.yml` | ❌ never triggered; Trivy floating `@master`, non-gating | ✅ **fixed** | Retargeted to `master`; Trivy pinned to immutable **`v0.36.0`** (supply-chain hardening) with **`exit-code: '1'`** so CRITICAL/HIGH findings fail the job; SARIF still uploaded with `if: always()` (`4ea8dc4`) |
| `daily-security.yml` | ❌ failing on 16 CVEs; EOL Node 20 | ✅ **fixed** | Vulnerabilities reduced 14 → 5 (2 critical → 0) so `npm audit --audit-level=high` passes on the accepted-residual set; Node 20 → 24 (`e661575`). *Will fail loudly if a new runtime high/critical appears — intended behavior.* |
| `release.yml` | ❌ invalid Dockerfile | ✅ **fixed (statically)** | `public/` + `storage/` tracked, `.dockerignore` populated, builder `NODE_ENV` corrected, compose secrets externalised, Node 24 base (`7a75bc0`, `4ea8dc4`, `e661575`). *Not yet exercised — no tag pushed.* |

**Verification:** all four workflows were validated statically (YAML structure, action versions, command availability) and every command they run was executed locally with green results. They cannot be observed executing until this repository is pushed to GitHub (the local clone has no remote configured).

### Remaining CI/CD Gaps (tracked in `TECHNICAL-DEBT.md`)

1. **No E2E stage** — the Playwright/Integration stages in the original pipeline diagram did not exist; `docs/CI-CD.md` was corrected accordingly (TD-P3-04).
2. **No container image scan** — Trivy scans the filesystem; the release-built image is never scanned (TD-P2-05). Adding `scan-type: image` should precede any registry push.
3. **Docker build not in PR CI** — Dockerfile regressions only surface on tag pushes (TD-P2-05).
4. **SARIF upload requires GitHub Advanced Security on private repos** — `upload-sarif` may fail without it; if the repo stays private without GHAS, gate the upload step on `github.advanced_security.enabled` rather than weakening the scan itself.
5. **Workflows have never actually executed** — first push to GitHub must confirm green, then badges become meaningful (TD-P3-09).
