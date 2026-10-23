# TelcoQualify Enterprise — Remediation & Repair Log

> **Journal Started:** October 23, 2026  
> **Completed:** October 23, 2026 (P0–P2 scope; residual P2+ tracked in `TECHNICAL-DEBT.md`)  
> **Maintainer:** Lead Software Architect & DevSecOps Lead

This journal records all systematic repairs, architectural fixes, security patches, new capabilities, and test additions applied to the codebase following the comprehensive technical audit. Every entry was verified by actually running the gate commands (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`) — no entry is marked done without a green run.

**Gate status at end of journal:** typecheck ✔ · lint (0 warnings) ✔ · 26 custom + 30 Vitest tests ✔ · build (23 routes) ✔ · live dev-server smoke ✔

---

## Remediation Entries — Original Register (REM-001 … REM-014)

| Issue ID | Priority | Description | Affected Files | Status |
| :--- | :---: | :--- | :--- | :---: |
| **REM-001** | P0 | Configure ESLint to unblock CI quality gate | `.eslintrc.json` | **DONE** — `7a75bc0` (config committed; lint also switched to `eslint . --max-warnings=0` in `d788ba9`) |
| **REM-002** | P0 | Repair Dockerfile missing directories (`public/`/`storage/`) | `public/`, `storage/uploads/.gitkeep`, `docker/Dockerfile` | **DONE** — `7a75bc0`, `4ea8dc4` |
| **REM-003** | P0 | Remove header-based auth bypass (`x-user-role`, `x-user-id`) | `src/core/security/api-guard.ts` | **DONE** — `99a132b` |
| **REM-004** | P0 | Remove hardcoded JWT secret fallback in production | `src/core/security/jwt.ts` | **DONE** — `99a132b` (prod hard-fail if missing/<32 chars) |
| **REM-005** | P1 | Secure password hashing (`bcryptjs`) & credential check | `src/app/api/auth/login/route.ts`, `src/core/storage/seed-data.ts` | **DONE** — `bdd3f9d` + `2f15553` (real bcrypt hashes, static branches removed) |
| **REM-006** | P1 | Gate Persona/Role switcher to development mode only | `src/components/layout/role-switcher.tsx`, `src/lib/dev/dev-guard.ts` | **DONE** — `c98f03b` (NODE_ENV-only gate, env escape hatch removed, dev endpoints 403 in prod) |
| **REM-007** | P1 | Implement Customer & Contact & Site Creation Form/Workflow | `src/app/customers/page.tsx`, `src/app/api/customers/**` | **DONE** — `2f15553` + `99a132b` + `9ca119b` (model, repos, APIs with duplicate detection, creation UI surfacing 409s) |
| **REM-008** | P1 | Allow starting Solution Case directly from Customer | `src/app/customers/page.tsx`, `src/app/cases/new/page.tsx` | **DONE** — `9ca119b` (case creation accepts real customer + `siteIds`) |
| **REM-009** | P1 | Dynamic site & requirements intake in New Case form | `src/app/cases/new/page.tsx` | **DONE** — `9ca119b` (real questionnaire inputs + site selection; no hardcoded Paris HQ) |
| **REM-010** | P1 | Refactor UI components to consume server REST APIs | all `src/app/**/page.tsx`, `src/lib/api/client.ts` | **DONE** — `9ca119b` (cookie-based `apiGet`/`apiSend`, loading/error states everywhere) |
| **REM-011** | P1 | Sanitize seed data & separate dev fixtures from empty production | `src/core/storage/seed-data.ts`, `database.ts` | **DONE** — `2f15553` (fictional `*@example.test` personas, bcrypt hashes, seeding gated to non-prod/`TELCO_ALLOW_SEEDING`, prod warns when empty) |
| **REM-012** | P2 | Persistent storage layer with empty database first-run support | `src/core/storage/database.ts` | **OPEN** — in-memory only; graceful empty production start DONE (`2f15553`), persistence tracked as TD-P2-01 |
| **REM-013** | P0 | Fix npm audit vulnerabilities in `package-lock.json` | `package.json`, `package-lock.json` | **DONE (partial accepted)** — `e661575`: 14 → 5 findings, 2 critical → 0; 5 build-time CSS residuals documented in `SECURITY-AUDIT.md` §4 |
| **REM-014** | P1 | Add comprehensive integration tests for Customer & RBAC | `src/core/security/api-guard.test.ts` | **DONE** — `99a132b` (17 Vitest tests: guard, IDOR scoping, grant matrix, seed hygiene) |

---

## Remediation Entries — Additional Work Discovered During Repair (REM-015 … REM-031)

| Issue ID | Priority | Description | Affected Files | Status |
| :--- | :---: | :--- | :--- | :---: |
| **REM-015** | P0 | Mass assignment: whitelist every mutating body with zod; server derives ownership/case numbers/lifecycle/versions/offer totals | all `src/app/api/**/route.ts` | **DONE** — `99a132b` |
| **REM-016** | P0 | IDOR record scoping (`canAccessCustomer`/`canAccessCase`, 404 for out-of-scope) | `src/core/security/api-guard.ts` | **DONE** — `99a132b` |
| **REM-017** | P0 | **Bug found by new tests:** expert-request assignment granted case read access to *any* role — gate on `expert_requests:respond` | `src/core/security/api-guard.ts` | **DONE** — `99a132b` + regression test |
| **REM-018** | P0 | Login brute-force protection (5 failures/15 min per IP+email → 429) | `src/app/api/auth/login/route.ts` | **DONE** — `99a132b` (per-process; residual = SEC-014) |
| **REM-019** | P0 | Route lifecycle changes hop-by-hop through `CaseStateMachine`; documents start `PENDING_SCAN` (was false `CLEAN`); filename path/control-char rejection; audit limit clamped (≤500) | `src/app/api/cases/**` | **DONE** — `99a132b` |
| **REM-020** | P0 | HttpOnly cookie-only session: JWT no longer in response body, no `localStorage`, AuthGuard/AppShell on every route but `/login` | `src/lib/auth/*`, `src/app/api/auth/login` | **DONE** — `c98f03b` |
| **REM-021** | P1 | CI: settle triggers on the verified GitHub default branch `main` (the local copy sat on a local-only `master` with no remote; `develop` never existed) and wire Vitest into `npm test` + CI | `.github/workflows/ci.yml`, `package.json` | **DONE** — `4ea8dc4`, refined `d7060cf`+pre-push check |
| **REM-032** | P1 | **Pre-push branch reconciliation:** GitHub API revealed the public repo's default branch is `main` with real run history (CI failing 3/3, security passing vacuously, daily audit failing 25/25 — correcting the local-only "never triggered" finding); workflows retargeted `master`→`main`, local branch renamed, docs corrected across 8 files | `.github/workflows/*`, `README.md`, `docs/*` | **DONE — this batch** |
| **REM-022** | P1 | CI: pin Trivy action `@master` → immutable `v0.36.0`; add `exit-code: '1'` so CRITICAL/HIGH genuinely gate | `.github/workflows/security.yml` | **DONE** — `4ea8dc4` |
| **REM-023** | P1 | Docker: populate empty `.dockerignore` (`.git`/`node_modules`/`.next`/`.env*` excluded); builder `NODE_ENV` fix; runner copies `scripts/`+`storage/` | `.dockerignore`, `docker/Dockerfile` | **DONE** — `4ea8dc4` |
| **REM-024** | P1 | Docker Compose: remove committed Postgres password/JWT secret → required env interpolation + gitignored `docker/docker-compose.env` + committed example; DB/Redis ports loopback-only | `docker/docker-compose.yml`, `docker/docker-compose.env.example` | **DONE** — `4ea8dc4` |
| **REM-025** | P2 | Delete dead/broken scripts: `run-tests.mjs` (crashed on load) and fake `seed.mjs` (printed only, seeded nothing); compute real success rate in `test-runner.mjs` | `scripts/` | **DONE** — `4ea8dc4`, `d7060cf` |
| **REM-026** | P0 | Dependency upgrade: `next` 14.2.35 → 15.5.28 (patches 4 advisories incl. 3 critical RCEs); remove unused `uuid` | `package.json` | **DONE** — `e661575` |
| **REM-027** | P0 | Next 15 breaking change: await `params` in all 19 dynamic route handlers (fixes `sync-dynamic-apis` errors + `.next/types` type failures); switch lint off deprecated `next lint` to `eslint . --max-warnings=0` | `src/app/api/**` (11 files), `package.json` | **DONE** — `d788ba9` (verified: 0 deprecation errors in live log) |
| **REM-028** | P1 | Dependency upgrade: `eslint-config-next` → 15.5.28 (matches runtime; clears `glob` chain), `vitest` 2 → 5.0.5 + `@types/node` 24 (clears both criticals); 30/30 tests verified on v5 | `package.json` | **DONE** — `e661575` |
| **REM-029** | P1 | EOL runtime: Node 20 (EOL April 2026) → Node 24 LTS in CI, daily audit workflow, and Docker base/runner images | `.github/workflows/*`, `docker/Dockerfile` | **DONE** — `e661575` |
| **REM-030** | P1 | Documentation truth pass: README (version badge 0.1.0→1.0.0, Postgres/Redis claims removed, real demo credentials, Known Limitations section), `.env.example` reduced to the 3 env vars actually read, `docs/CI-CD.md` + `docs/SECURITY.md` stripped of phantom Playwright/Semgrep/Prometheus/Redis-blacklist claims | `README.md`, `.env.example`, `docs/CI-CD.md`, `docs/SECURITY.md` | **DONE** — `d7060cf` |
| **REM-033** | P0 | **New HIGH advisory caught by the new audit gate before push:** zod `GHSA-mrhx-c7xc-m3w5` (CVE-2023-54404, memory-exhaustion DoS; all zod 3.x affected) → upgrade zod 3.23 → 4.6.7 (zero code changes; typecheck/tests/build green on v4) | `package.json`, `package-lock.json` | **DONE — this batch** |
| **REM-034** | P1 | Replace raw `npm audit --audit-level=high` (cannot express accepted risk; failed 25/25 days) with `scripts/audit-gate.mjs` — gates on unaccepted high/critical only, tolerating entries documented in tracked `/.trivyignore` (shared with Trivy, so both security gates agree); wire into `daily-security.yml` | `scripts/audit-gate.mjs`, `.trivyignore`, `.github/workflows/daily-security.yml` | **DONE — this batch** (verified: PASS locally with only postcss accepted) |
| **REM-031** | P2 | Refresh all audit deliverables with post-remediation status; write FINAL-REMEDIATION-REPORT; correct `docs/THREAT-MODEL.md` aspirational claims | `docs/audits/*`, `docs/THREAT-MODEL.md` | **DONE — this entry** |

---

## Commit Map

| Commit | Contents |
|---|---|
| `7a75bc0` | chore(tooling): ESLint config, tsbuildinfo, public/, storage/ |
| `2f15553` | feat(domain): Contact/Site model, repository CRUD, production seeding gate |
| `99a132b` | fix(security): authn/authz, IDOR, validation on all API routes + 17-test suite |
| `c98f03b` | feat(auth): HttpOnly cookie-only session with guarded client shell |
| `9ca119b` | refactor(ui): client pages migrated from in-process repository to REST API |
| `a40ecaf` | fix(tests): custom test runner fixture aligned with fictional personas |
| `4ea8dc4` | ci: dead branch triggers, Trivy pin/gating, compose secrets, Docker fixes |
| `d788ba9` | fix(next)!: awaited route params for Next.js 15 + direct ESLint invocation |
| `e661575` | chore(deps): 9 advisories cleared incl. 2 criticals; Node 20 → 24 LTS |
| `d7060cf` | docs: README/env/doc truth pass |
| *(this batch)* | docs(audits): refreshed audit suite + final remediation report |

---

## Verification Log (final run, October 23, 2026)

```
npm run typecheck   → exit 0
npm run lint        → exit 0 (0 errors, 0 warnings, --max-warnings=0)
npm run test        → 26/26 custom + 30/30 Vitest, exit 0
npm run build       → exit 0, 23 routes
dev-server smoke    → login 200; /api/customers/CUST-001 200; /api/cases/CASE-2026-001 200;
                      all 8 pages 200; 0 sync-dynamic-apis / deprecation errors in log
npm audit (via scripts/audit-gate.mjs)
              → PASS: 5 findings (2 critical → 0); only documented postcss/tailwind
                build-time residuals accepted (/.trivyignore); zod HIGH
                (GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404) caught by the gate
                pre-push and fixed (zod 3 → 4.6.7)
```
