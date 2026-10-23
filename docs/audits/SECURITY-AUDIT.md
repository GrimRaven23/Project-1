# TelcoQualify Enterprise — Security Audit Report

> **Audit Date:** October 23, 2026  
> **Remediation & Re-verification:** October 23, 2026 (same day)  
> **Security Baseline:** OWASP Top 10 (2021), OWASP ASVS v4.0.3 Level 2  
> **Classification:** INTERNAL AUDIT — RESTRICTED

---

## 1. Security Posture Overview

A rigorous defensive security review was conducted across the codebase, covering authentication, authorization, session management, cryptographic implementations, injection risks, data masking, API boundaries, and supply chain dependencies.

### Summary of Findings (as originally reported):
- **Total Findings:** 10
- **Critical:** 2
- **High:** 5
- **Medium:** 2
- **Low:** 1

### Post-Remediation Summary (re-verified October 23, 2026):
- **Fixed & verified:** 9 of 10 (SEC-001 … SEC-007, SEC-009, SEC-010)
- **Partially fixed, residual accepted:** 0 (SEC-008 — the last HIGH was later *eliminated* by a `postcss` override; only 3 moderates remain, below the gate threshold — see §4)
- **New findings raised during remediation:** 5 (SEC-011 … SEC-015); 4 fixed, 1 accepted
- **Verification evidence:** `npm run typecheck` ✔, `npm run lint` (zero warnings) ✔, `npm run test` (26 custom + 30 Vitest) ✔, `npm run build` (23 routes) ✔, live dev-server smoke test (login → API → all pages, 0 deprecation errors) ✔

---

## 2. Vulnerability Findings Matrix

| Finding ID | Severity | Title | Affected Component | Status |
| :--- | :---: | :--- | :--- | :---: |
| **SEC-001** | **CRITICAL** | Global Authentication & Authorization Bypass via Header Spoofing | `src/core/security/api-guard.ts` | **FIXED** — `99a132b` |
| **SEC-002** | **CRITICAL** | Insecure Static Password Validation & Missing Hash Storage | `src/app/api/auth/login/route.ts` | **FIXED** — `bdd3f9d`/`99a132b` |
| **SEC-003** | **HIGH** | Hardcoded Fallback Cryptographic Secret for JWT Signing | `src/core/security/jwt.ts` | **FIXED** — `99a132b` |
| **SEC-004** | **HIGH** | Production Navbar Role Switcher Allowing Unrestricted Impersonation | `src/components/layout/role-switcher.tsx` | **FIXED** — `c98f03b` |
| **SEC-005** | **HIGH** | Client-Side Direct Memory DB Import Bypassing Server-Side RBAC | Client components | **FIXED** — `9ca119b` |
| **SEC-006** | **MEDIUM** | JWT Token Stored in Insecure Browser LocalStorage | `src/lib/auth/auth-context.tsx` | **FIXED** — `c98f03b` |
| **SEC-007** | **HIGH** | Missing ESLint Configuration Halting Automated SAST in CI Gate | `.eslintrc.json` / `package.json` | **FIXED** — `7a75bc0` |
| **SEC-008** | **HIGH** | Unpatched Vulnerabilities in Next.js, PostCSS, and Dependencies | `package.json`, `package-lock.json` | **FIXED** — 9 of 14 advisories cleared (`e661575`); zod HIGH caught & fixed (`0a5b163`); last postcss HIGH **eliminated** via `overrides` (`this batch`). 3 moderates remain, below the gate threshold (§4) |
| **SEC-009** | **MEDIUM** | Dockerfile Build Failure on Missing Public/Storage Directories | `docker/Dockerfile` | **FIXED** — `7a75bc0`/`4ea8dc4` |
| **SEC-010** | **LOW** | Static Plaintext Credentials Committed in Docker Compose | `docker/docker-compose.yml` | **FIXED** — `4ea8dc4` |
| **SEC-011** | **HIGH** *(new)* | IDOR: Expert-Request Assignment Widened Case Read Access to Any Role | `src/core/security/api-guard.ts` | **FIXED** — `99a132b` (caught by new test suite) |
| **SEC-012** | **HIGH** *(new)* | Mass Assignment on Every Mutating API Route (no body whitelisting) | `src/app/api/**/route.ts` | **FIXED** — `99a132b` (zod whitelists; server-derived fields) |
| **SEC-013** | **HIGH** *(new)* | CI Security Gates Never Executed (dead branch triggers, floating Trivy ref, non-gating scans) | `.github/workflows/*` | **FIXED** — `4ea8dc4` |
| **SEC-014** | **MEDIUM** *(new)* | Login Rate Limiting & Session Revocation Are Per-Process Only | `/api/auth/login`, `src/core/security/jwt.ts` | **ACCEPTED (documented)** — §4 |

---

## 3. In-Depth Vulnerability Details

### SEC-001: Global Authentication & Authorization Bypass via Header Spoofing
- **Severity:** **CRITICAL** (CVSS 9.8 - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
- **Component:** `src/core/security/api-guard.ts`
- **Evidence (pre-fix):**
  ```typescript
  const devUserRole = request.headers.get("x-user-role") as UserRole | null;
  if (devUserRole) {
    const users = DatabaseRepository.getUsers();
    const match = users.find((u) => u.role === devUserRole);
    if (match) return { user: match };
    return { user: { id: `DEV-${devUserRole}`, role: devUserRole, ... } };
  }
  ```
- **Impact:** Any unauthenticated external client could send `x-user-role: SUPER_ADMIN` and gain full administrative access.
- **Remediation applied:** Header-based developer bypass removed entirely. `ApiGuard.verifyAccess` now requires a real signed JWT whose subject still exists in the user store; the role is read from the store (never trusted from the token claim), and `isActive === false` is rejected with 403.
- **Status:** **FIXED** — verified by `src/core/security/api-guard.test.ts` (17 tests) including explicit "spoofed headers are ignored" cases.

---

### SEC-002: Insecure Static Password Validation & Missing Hash Storage
- **Severity:** **CRITICAL** (CVSS 9.1 - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)
- **Component:** `src/app/api/auth/login/route.ts`
- **Evidence (pre-fix):** password accepted if equal to `"Password123!"`, `"admin"`, `"demo"`, or the email prefix; no hash comparison.
- **Impact:** Any account could be logged into with a publicly documented static string.
- **Remediation applied:** Real `bcryptjs` hash verification against `passwordHash` stored on each seeded user; static comparison branches and plaintext passwords removed from the code path. Failed attempts are counted by the brute-force limiter and the submitted email is no longer echoed on failure responses.
- **Status:** **FIXED** — verified by live login against `commercial.demo@example.test` / demo password, and by the custom test harness (bcrypt + JWT suite).

---

### SEC-003: Hardcoded Fallback Cryptographic Secret for JWT Signing
- **Severity:** **HIGH** (CVSS 8.2 - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N)
- **Component:** `src/core/security/jwt.ts`
- **Evidence (pre-fix):**
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET || "telcoqualify-enterprise-secure-jwt-secret-key-32chars";
  ```
- **Impact:** With `JWT_SECRET` unset, anyone could forge tokens for any role using the public repository key.
- **Remediation applied:** `getJwtSecret()` — in production, startup **throws** if `JWT_SECRET` is missing or shorter than 32 characters. A distinct dev-only fallback key is used outside production and is labelled as such.
- **Status:** **FIXED** — verified by unit test and by production-mode boot behavior.

---

### SEC-004: Production Navbar Role Switcher Allowing Unrestricted Impersonation
- **Severity:** **HIGH** (CVSS 8.6 - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)
- **Component:** `src/components/layout/role-switcher.tsx` & `src/components/layout/navbar.tsx`
- **Evidence (pre-fix):** switcher rendered unconditionally in the navbar; one click logged into `SUPER_ADMIN` using the static password from SEC-002.
- **Impact:** Any visitor could elevate to Super Admin from the UI.
- **Remediation applied:** Switcher renders only when `NODE_ENV !== "production"`; persona switching now goes through dev-only endpoints (`/api/dev/personas`, `/api/dev/switch`) that issue **real** signed JWTs and hard-403 under `NODE_ENV=production` (`src/lib/dev/dev-guard.ts`). The previous `NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER` environment escape hatch was removed — there is no configuration that re-enables it in production.
- **Status:** **FIXED** — verified by test and by code inspection of the guard.

---

### SEC-005: Client-Side Direct Memory DB Import Bypassing Server-Side RBAC
- **Severity:** **HIGH** (CVSS 7.5 - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)
- **Component:** `src/app/cases/[id]/page.tsx`, `src/app/cases/page.tsx`, `src/app/audit/page.tsx`, …
- **Evidence (pre-fix):** client components invoked `DatabaseRepository.getCaseById()` directly in the browser bundle, so server-side masking and RBAC never ran for UI reads.
- **Impact:** Field-level authorization and confidentiality boundaries were bypassed for every page load.
- **Remediation applied:** all client pages migrated to the REST API through `src/lib/api/client.ts` (`apiGet`/`apiSend`, cookie session, no token handling); `AuthGuard` + `AppShell` gate every route except `/login`. Server-side guards are now on the only path to data.
- **Status:** **FIXED** — verified by build (no server repository imports remain in client bundles) and live page smoke tests.

---

### SEC-006: JWT Token Stored in Insecure Browser LocalStorage
- **Severity:** **MEDIUM** (CVSS 5.3 - AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N)
- **Component:** `src/lib/auth/auth-context.tsx`
- **Evidence (pre-fix):** `localStorage.setItem("telco_auth_token", data.token);`
- **Impact:** Session token exfiltrable via XSS.
- **Remediation applied:** session lives **only** in the `telco_token` HttpOnly / SameSite=Lax cookie set by `/api/auth/login`; the login response body no longer contains a token; all `localStorage` usage removed; client code never touches the token.
- **Status:** **FIXED** — verified by test asserting HttpOnly/SameSite flags and by absence of any localStorage token access.

---

### SEC-007: Missing ESLint Configuration Halting Automated SAST in CI Gate
- **Severity:** **HIGH** (CVSS 7.0 - DevSecOps Quality Gate Failure)
- **Component:** `.eslintrc.json` / `package.json`
- **Remediation applied:** `.eslintrc.json` committed (extends `next/core-web-vitals`); lint now runs `eslint . --max-warnings=0` (warnings gate too) and covers `scripts/` in addition to `src/`.
- **Status:** **FIXED** — `npm run lint` exits 0 with zero warnings.

---

### SEC-008: Unpatched Vulnerabilities in Next.js, PostCSS, and Dependencies
- **Severity:** **HIGH** (CVSS 7.5 - Supply Chain Vulnerability)
- **Component:** `package-lock.json`
- **Evidence (pre-fix):** `npm audit` reported 16 vulnerabilities (3 Critical, 7 High, 6 Moderate).
- **Remediation applied:**
  - `next` 14.2.35 → **15.5.28** — patches all four Next advisories (3 critical RCEs + 1 high DoS) without crossing to the breaking `next@16` major; all route handlers migrated to awaited `params` per Next 15 (`d788ba9`).
  - `eslint-config-next` → 15.5.28 — clears the `@next/eslint-plugin-next → glob` command-injection chain.
  - `vitest` 2.1.9 → **5.0.5** (+ `@types/node` 24) — clears **both criticals** (`tinypool` prototype-pollution RCE) plus `vite`/`vite-node`/`@vitest/mocker`/`esbuild` advisories.
  - Unused `uuid` dependency removed.
  - **New advisory caught by the remediation gate:** zod `GHSA-mrhx-c7xc-m3w5` (CVE-2023-54404, HIGH — memory-exhaustion DoS in array validation; all zod 3.x affected) published 2026-10-01, surfaced by the new accepted-risk audit gate just before the push — fixed by upgrading zod 3.23 → **4.6.7** (zero code changes; typecheck/tests/build green on v4).
  - Result: **14 → 5 findings (2 critical → 0 critical)**.
  - **Then eliminated outright (2026-10-23):** the first live Trivy run proved the residual postcss HIGH was fixable within major 8, so an npm `overrides` entry forced `postcss@^8.5.31`, collapsing the vulnerable nested `8.4.31` (pinned by `next`) into the patched root copy → **3 findings, 0 high, 0 critical**.
- **Status:** **FIXED** — zero high/critical remain; only 3 moderates (tailwind 3 chain, below the gate threshold) — see §4.

---

### SEC-009: Dockerfile Build Failure on Missing Public/Storage Directories
- **Severity:** **MEDIUM** (CVSS 5.0 - Availability & Release Automation Failure)
- **Component:** `docker/Dockerfile`
- **Remediation applied:** `public/` (robots.txt) and `storage/uploads/.gitkeep` tracked; `.dockerignore` populated (was **empty** — `COPY . .` previously shipped `.git`, `node_modules`, `.next`, and any local `.env` into builder layers); builder stage no longer inherits `NODE_ENV=production` (which made `npm ci` skip devDependencies and broke `next build`); runner now copies `scripts/` and `storage/` with correct ownership.
- **Status:** **FIXED** — files present and Dockerfile corrected; the image build is now verified by a dedicated `Docker Image Build` job in `ci.yml` on every push (added 2026-10-23 after the first release build exposed a builder-stage `NODE_ENV` defect — see `docs/audits/FINAL-REMEDIATION-REPORT.md` §7.1).

---

### SEC-010: Static Plaintext Credentials Committed in Docker Compose
- **Severity:** **LOW** (CVSS 3.0 - Secret Exposure in Config)
- **Component:** `docker/docker-compose.yml`
- **Evidence (pre-fix):** `POSTGRES_PASSWORD: Secr3tPostgresPass!` and a hardcoded `JWT_SECRET` committed in a tracked file.
- **Remediation applied:** compose now uses required env interpolation (`${VAR:?…}` — fails fast when unset), backed by a **gitignored** `docker/docker-compose.env` and a committed `docker-compose.env.example` template; Postgres/Redis ports bound to loopback only.
- **Status:** **FIXED** (note: no real secret was ever deployed; the committed values were placeholders).

---

### SEC-011: IDOR — Expert-Request Assignment Widened Case Read Access to Any Role *(new, found during remediation)*
- **Severity:** **HIGH**
- **Component:** `src/core/security/api-guard.ts` (`canAccessCase`)
- **Evidence:** The initial IDOR-scoping implementation granted case read access to *any* user named as an `assignedExpertUserId` on one of the case's expert requests — including commercial agents listed on another team's case. The newly written `api-guard.test.ts` **failed** on this scenario, catching it before commit.
- **Impact:** Horizontal privilege escalation: cross-team read access to foreign cases (potentially including masked/security-sensitive fields) purely by appearing on an unrelated expert request.
- **Remediation applied:** the assignment-based widening is now gated on the caller holding `expert_requests:respond` (specialist roles only); out-of-scope records return **404** to avoid confirming existence.
- **Status:** **FIXED** — verified by the dedicated regression test (`denies a commercial agent read access purely via an unrelated expert request`).

---

### SEC-012: Mass Assignment on Every Mutating API Route *(new, found during remediation)*
- **Severity:** **HIGH**
- **Component:** all `src/app/api/**/route.ts` POST/PUT handlers
- **Evidence (pre-fix):** request bodies were spread directly into stored records, letting clients set `assignedCommercialId`, `caseNumber`, lifecycle `status`, `version`, `createdBy`, offer totals, and approval provenance.
- **Impact:** privilege escalation and lifecycle forgery through ordinary API calls (e.g. self-approving an offer).
- **Remediation applied:** every mutating route validates its body with a zod **whitelist schema** (unknown keys stripped); the server derives ownership, case numbers, lifecycle state (via `CaseStateMachine`, hop-by-hop), versions, offer totals; offers always start `DRAFT` with server-derived approval provenance.
- **Status:** **FIXED** — verified by route tests and review of every handler.

---

### SEC-013: CI Security Gates Effectively Non-Gating *(new, found during remediation; refined at push time)*
- **Severity:** **HIGH**
- **Component:** `.github/workflows/{ci,security,daily-security}.yml`
- **Evidence:** locally the working copy sat on a local-only `master` with no remote (so nothing could trigger from here), `develop` never existed anywhere, and Trivy used a floating `@master` ref (trivy-action tags were recently targeted by a supply-chain attack) with no `exit-code`, so critical findings still left the job green. **Verified via the GitHub API before pushing (2026-10-23):** on the public repo's actual `main` branch, the CI Quality Gate had run 3× and **failed 3/3** (missing ESLint config), the Security pipeline "passed" 3/3 only because Trivy was non-gating, and the daily audit failed 25/25 days on the open CVEs — i.e. the quality gate was red and the security gate was green for the wrong reasons.
- **Remediation applied:** triggers settled on **`main`** (the verified default branch; local branch renamed before push) and phantom `develop` dropped; Trivy pinned to immutable `v0.36.0` with `exit-code: '1'`; accepted-risk entries tracked in `/.trivyignore` (shared with the new `scripts/audit-gate.mjs` that replaces raw `npm audit --audit-level=high` in the daily job); Vitest wired into `npm test` and CI; Node 20 (EOL April 2026) → 24; no `continue-on-error`/`|| true` anywhere.
- **Status:** **FIXED** — proof is the post-push run history on `main`.

---

### SEC-014: Login Rate Limiting & Session Revocation Are Per-Process Only *(new, accepted)*
- **Severity:** **MEDIUM**
- **Component:** `/api/auth/login`, `src/core/security/jwt.ts`
- **Evidence:** the brute-force window (5 failures / 15 min per IP+email) lives in process memory; JWTs are stateless with a hardcoded 24 h expiry and **no revocation list**.
- **Impact:** single-instance deployments retain full protection; multi-instance deployments do not share counters, and a stolen token remains valid until expiry unless `JWT_SECRET` is rotated.
- **Decision:** **accepted for this stage** — the platform is a single-process application with no scaling deployment. Documented in README Known Limitations and `docs/SECURITY.md` (rotation is the documented kill switch).
- **Status:** **ACCEPTED (documented)** — revisit before any horizontal scaling.

### SEC-015: Accepted-Risk List Was Scanner-Specific and Would Not Have Suppressed Findings *(new, found by the first live gated run)*
- **Severity:** **MEDIUM**
- **Component:** `.trivyignore`, `scripts/audit-gate.mjs`, `.github/workflows/security.yml`
- **Evidence:** the first post-push Security run failed on Trivy while `npm audit` passed on the same tree. Trivy reports vulnerabilities by **CVE** id; the accepted-risk list carried **GHSA** ids from `npm audit`; the two id spaces do not map 1:1, so the four accepted postcss GHSAs matched none of the four CVEs Trivy actually raised (CVE-2026-73646, CVE-2026-45623, CVE-2026-41305, CVE-2026-69153). The accepted list would have been silently ineffective against the gate it was written for.
- **Root cause exploited to fix properly:** the failure forced a re-examination that proved the accepted-risk premise itself was wrong — the postcss advisories were fixable within major 8 via an `overrides` entry (§4.1), so no acceptance was needed at all.
- **Remediation applied:** `postcss` override eliminates the advisories; `/.trivyignore` emptied of advisory ids; §4.3 documents that any future accepted advisory must list **both** its GHSA and CVE ids.
- **Status:** **FIXED**

---

## 4. Accepted Residual Risk

**There are currently ZERO accepted high/critical advisories.** This section
exists to record how that changed, and to be the rationale of record should a
future advisory have to be accepted.

### 4.1 The postcss HIGH — eliminated, not accepted (2026-10-23)

The first remediation batch had accepted 4 postcss advisories (1 HIGH + the
`next`-carrier line) on the stated grounds that "only `next@16` fixes them".
**That reasoning was wrong and was overturned by the first live security run.**

- The advisory **Trivy** reports on the runner (CVE-2026-73646, CVE-2026-45623,
  CVE-2026-41305, CVE-2026-69153) maps to a `postcss` **minimum fixed version
  of 8.5.x — a semver-compatible minor within the same major 8**. No breaking
  major was ever required.
- The vulnerable copy was not "bundled inside" `next` in an unfixable way: it
  was an **exact-pinned nested dependency** (`next@15.5.28` → `postcss@8.4.31`)
  sitting alongside an already-patched root `postcss@8.5.31` used by
  tailwindcss/autoprefixer/vite.
- Fixed with a **one-line npm `overrides` entry** forcing `postcss@^8.5.31`,
  plus aligning the direct devDependency spec to the same range. The nested
  vulnerable copy collapsed into the single patched root copy.

**Result: `npm audit` 5 findings (1 high, 4 moderate) → 3 findings (0 high,
3 moderate).** Zero critical, zero high, zero accepted. The build, typecheck and
all 56 tests were re-verified green on the overridden tree.

### 4.2 Remaining moderate findings (not accepted — below the gate threshold)

`npm audit` reports **3 MODERATE** advisories, all in the build-time CSS
toolchain. These are *not* recorded as accepted risk; they simply do not meet
the high/critical bar that either security gate fails on:

| Package | Severity | Why it remains | Justification |
|---|---|---|---|
| `tailwindcss` 3.4.19 | MODERATE | Only fixed by `tailwind@4` (breaking config migration) | Build-time utility generation over developer-authored config; never processes request data. |
| `postcss-nested` | MODERATE | Same tailwind 3.x chain | Same. |
| `postcss-selector-parser` | MODERATE | Same tailwind 3.x chain | Same. |

**Decision:** not accepted (moderate is below the documented gate threshold);
re-evaluated daily by `daily-security.yml`. A tailwind 4 migration is tracked
as P2 debt in `TECHNICAL-DEBT.md` (TD-P2-04).

### 4.3 Mechanism for any future acceptance

Accepted advisories live in the tracked **`/.trivyignore`** — the single shared
list consumed by *both* the Trivy scan (`security.yml`) and
`scripts/audit-gate.mjs` (`daily-security.yml`), so the two gates can never
disagree. The file currently carries **no advisory IDs**. Any entry added must
cite this section and its rationale. A high/critical advisory *not* in the file
fails both gates.

> **Trivy/npm-audit ID mismatch note:** npm audit reports by **GHSA** id, Trivy
> reports by **CVE** id, and the mapping is not 1:1 — the earlier accepted
> postcss GHSAs did not match the CVEs Trivy actually raised, so the accepted
> list would not have suppressed them anyway. Listing **both** the GHSA and CVE
> ids for any future accepted advisory is therefore mandatory.

---

## 5. Post-Remediation Verification Record

All performed on October 23, 2026 against the remediated tree:

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | ✔ exit 0 (incl. Next 15 generated `.next/types`) |
| Lint | `npm run lint` (`eslint . --max-warnings=0`) | ✔ 0 errors, 0 warnings |
| Custom business-rule suite | `npm run test:custom` | ✔ 26/26 |
| Vitest security/unit suite | `npm run test:unit` | ✔ 30/30 (incl. 17 new guard/IDOR tests) |
| Production build | `npm run build` | ✔ 23 routes |
| Live smoke test | dev server: login → `/api/customers/CUST-001` → `/api/cases/CASE-2026-001` → all 8 pages | ✔ 200s; **0** `sync-dynamic-apis` / deprecation errors in log |
| Dependency audit | `scripts/audit-gate.mjs` (accepted-risk aware) | PASS — **3 findings, 0 critical, 0 high**; zero accepted advisories (`/.trivyignore` empty). zod HIGH (CVE-2023-54404) and the postcss HIGH both caught by the gates and eliminated pre-push |
