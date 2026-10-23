# TelcoQualify Enterprise — Technical Debt Report

> **Audit Date:** October 23, 2026  
> **Post-Remediation Update:** October 23, 2026 (dispositions applied after the repair pass)  
> **Auditor Role:** Lead Software Architect & Technical Maintainer

---

## 1. Classification Methodology
Technical debt is categorized strictly by engineering impact and operational risk:
- **P0 — Immediate (Critical Security, Build Failure, or Core Integrity Blockers):** Must be resolved before any deployment.
- **P1 — Short Term (Major Architectural Defect, Missing Core Business Functionality):** Required for standard commercial usage.
- **P2 — Medium Term (Scalability, Persistence, Complete Integration):** Necessary for long-term multi-developer maintenance.
- **P3 / P4 — Optional (Nice-to-Have Enhancements, Performance Polish):** Non-blocking improvements.

**Disposition legend:** ✅ CLEARED (fixed & verified) · ⏳ OPEN · 📄 DOCUMENTED (accepted with rationale)

---

## 2. Technical Debt Register

### Priority P0 — Immediate
1. **TD-P0-01: Header-based Authentication Bypass in `ApiGuard`** ✅ **CLEARED** — `99a132b`
   - *Impact:* Complete security compromise via `x-user-role` header.
   - *Fix applied:* bypass removed; signed-JWT + store-backed role + `isActive` enforcement. Regression tests in `src/core/security/api-guard.test.ts`.
2. **TD-P0-02: Missing ESLint Configuration Halting CI** ✅ **CLEARED** — `7a75bc0` (+ `d788ba9`)
   - *Fix applied:* `.eslintrc.json` committed; lint now `eslint . --max-warnings=0` (off the deprecated `next lint`), covering `scripts/` too.
3. **TD-P0-03: Hardcoded Cryptographic Key Fallback** ✅ **CLEARED** — `99a132b`
   - *Fix applied:* production hard-fails when `JWT_SECRET` missing or <32 chars; dev-only fallback key otherwise.
4. **TD-P0-04: Broken Dockerfile Build** ✅ **CLEARED** — `7a75bc0` + `4ea8dc4`
   - *Fix applied:* `public/` + `storage/` tracked; `.dockerignore` populated; builder `NODE_ENV` corrected. *(Docker build still only exercised on tag pushes — see TD-P2-05.)*

### Priority P1 — Short Term
1. **TD-P1-01: Missing Customer & Site Creation Capability** ✅ **CLEARED** — `2f15553` + `99a132b` + `9ca119b`
   - *Fix applied:* Contact/Site domain model, guarded CRUD APIs with duplicate detection, full creation UI.
2. **TD-P1-02: Client-Side Direct Memory DB Import (Architectural Disconnection)** ✅ **CLEARED** — `9ca119b`
   - *Fix applied:* every client page consumes `/api/*` through the cookie-based fetch wrapper; server RBAC/masking now on the only data path.
3. **TD-P1-03: Insecure Static Passwords & Demo Account Contamination** ✅ **CLEARED** — `bdd3f9d` + `2f15553` + `99a132b`
   - *Fix applied:* bcrypt hash verification, static branches removed, seeds fictional (`*@example.test`) and production never seeds (unless explicit `TELCO_ALLOW_SEEDING=true`).
4. **TD-P1-04: Hardcoded Questionnaire & Site Topography in New Case Form** ✅ **CLEARED** — `9ca119b`
   - *Fix applied:* real customer/site selection and real questionnaire inputs; server owns lifecycle fields.

### Priority P2 — Medium Term
1. **TD-P2-01: Volatile In-Memory Storage Architecture** ⏳ **OPEN (highest-priority remaining debt)**
   - *Impact:* All data lost on process restart; horizontal scaling impossible; audit trail not durable.
   - *Location:* `src/core/storage/database.ts`
   - *Path:* file-backed/SQLite adapter first, with a migration path to PostgreSQL (compose already provisions the service). This is the single largest gap in the production-readiness verdict.
2. **TD-P2-02: Non-Standard Test Runner** ✅ **CLEARED** — `4ea8dc4` + `e661575`
   - *Fix applied:* Vitest 5 wired into `npm test` alongside the custom business-rule harness; both gate CI; dead `run-tests.mjs` deleted. *(Still no E2E layer — see TD-P3-04.)*
3. **TD-P2-03: Document Upload Storage Stub** ⏳ **OPEN**
   - *Impact:* uploaded bytes are not persisted; no magic-byte validation; `PENDING_SCAN` never resolved (no scanner).
   - *Fix path:* write to `storage/uploads` with randomised names + magic-byte sniffing + a real or scanned pipeline integration. Uploads already get honest `PENDING_SCAN` status and sanitized filenames.
4. **TD-P2-04: Build-time dependency advisories (postcss-via-next, tailwind 3 chain)** 📄 **DOCUMENTED** — `e661575`
   - *Rationale:* 5 findings (1 high/4 moderate), all build-time CSS tooling over developer-authored input; only fixable via breaking majors (`next@16`, `tailwindcss@4`). Full justification: `SECURITY-AUDIT.md` §4. Re-evaluated daily by `daily-security.yml`.
5. **TD-P2-05: Docker image build not verified in the PR CI** ⏳ **OPEN**
   - *Impact:* Dockerfile regressions surface only when a release tag is pushed.
   - *Fix path:* add a `docker build` (or hadolint + build) job to `ci.yml`; add Trivy *image* scan before any registry push.

### Priority P3 / P4 — Optional
1. **TD-P3-01: Real-time Notification Engine** ⏳ **OPEN** — still a simulated badge; add SSE/polling endpoint when persistence exists.
2. **TD-P3-02: PDF Commercial Offer Export** ⏳ **OPEN** — HTML-to-PDF export for approved offers.
3. **TD-P3-03: Accessibility hardening** ⏳ **OPEN** — ARIA on modals, keyboard trap management, badge contrast (inherited finding, out of scope this pass).
4. **TD-P3-04: End-to-end (Playwright) test layer** ⏳ **OPEN** — unit/integration coverage exists (26+30); no browser-level E2E. Previously advertised in `docs/CI-CD.md` was aspirational and has been removed.
5. **TD-P3-05: Catalog administration UI** ⏳ **OPEN** — catalog is read-only for users; entries are labelled `(Demo)` fixtures.
6. **TD-P3-06: Asset inventory editor (serials/warranties)** ⏳ **OPEN** — domain types exist; no interactive editor.
7. **TD-P3-07: Admin user lifecycle management** ⏳ **OPEN** — `/admin` is read-only.

### New Debt Introduced/Discovered This Pass
1. **TD-P2-06: Per-process security state** 📄 **DOCUMENTED** (SEC-014) — login rate limiter and (absent) session revocation are single-process. Fine for the current single-instance topology; must move to shared storage (Redis/edge) before scaling out.
2. **TD-P3-08: Security headers gaps** ⏳ **OPEN** — no CSP or HSTS at the application layer (HSTS delegated to the documented reverse proxy; CSP absent entirely). Consider adding a strict CSP and `Strict-Transport-Security` in `next.config.mjs` for non-proxied deployments.
3. **TD-P3-09: CI was red/green for the wrong reasons on GitHub** 📄 **DOCUMENTED** — verified run history on `main` before the remediation push: quality gate failed 3/3 (missing ESLint), security passed only because Trivy was non-gating, daily audit failed 25/25 days. Repaired (retargeted triggers, gating Trivy, accepted-risk audit gate); the post-push runs must be observed green and badges activate then.
