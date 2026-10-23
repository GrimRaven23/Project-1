# Threat Model & Security Baseline (OWASP ASVS 5.x)
## TelcoQualify Enterprise Security Engineering

> **Last reviewed:** October 23, 2026 (post-remediation rewrite)  
> **Scope:** single Next.js application, single process, in-memory datastore, HttpOnly-cookie session model.  
> Claims below reflect **implemented** controls only; known gaps are listed in §4.

---

### 1. Trust Boundaries

```
[Browser: authenticated user session]
        │  HTTPS (terminating reverse proxy; TLS config is deployment-owned)
        │  Cookie: telco_token (HttpOnly, SameSite=Lax) — never readable by JS
        ▼
[Next.js server — route handlers]
        │  ApiGuard: JWT signature → user store lookup → RBAC permission →
        │  IDOR record scoping (404 out-of-scope) → zod body whitelist
        ▼
[In-memory domain store + audit log] ──(no persistence; lost on restart)
```

Anything **below** the ApiGuard line is unreachable without passing authentication, authorization, and record-scoping checks. Client-side UI gating (AuthGuard/AppShell) is defense-in-depth only.

---

### 2. STRIDE Analysis

| STRIDE Category | Potential Vector in Telco Presales System | Implemented Mitigation (verified) |
|---|---|---|
| **Spoofing** | Forged commercial rep identity; stolen/replayed token; header spoofing (`x-user-role`) | JWT signed with server-side `JWT_SECRET` (production hard-fails if missing/<32 chars); **header-based impersonation removed**; role re-read from the user store per request (`isActive=false` → 403); session confined to HttpOnly/SameSite=Lax cookie (no localStorage, no token in response body); login brute-force limited to 5 failures/15 min per IP+email → 429 *(per-process — §4)* |
| **Tampering** | Editing qualification results, BOM totals, offer approval, lifecycle state | All computations server-authoritative: qualification runs in the API, BOM generated server-side (client cannot submit its own BOM), offer totals/approval provenance/version numbers/case numbers/owner derived by the server, bodies pass zod whitelists (unknown fields stripped), lifecycle moves hop-by-hop through `CaseStateMachine` |
| **Repudiation** | Denying an approval or state change | Structured audit log records actor id/name/role, action, resource, correlation id, IP, `previousState` → `newState` for every mutation; readable at `/audit` *(in-memory — volatile, not cryptographically signed; see §4)* |
| **Information Disclosure** | Commercial rep reading expert-only security notes or foreign records | Field masking via `DataMaskingService` on case reads; classification-based field-level security; **IDOR scoping**: `customers:view_all` / `cases:view_all` roles see all, everyone else only own accounts/cases; out-of-scope records return **404**; expert-assignment widening only for `expert_requests:respond` holders (regression-tested); JWT secret required in prod; `poweredByHeader: false` |
| **Denial of Service** | Login credential stuffing; oversized/malformed payloads; giant list reads | Login rate limit (429); 25 MB upload cap + extension allowlist; zod body/array caps (arrays ≤ 50 items); audit reads clamped (≤ 500, default 100); JSON-parse guarded with 400 on malformed bodies. *(No global request throttling/timeout layer — §4)* |
| **Elevation of Privilege** | Ordinary user reaching admin actions; self-approving an offer; dev persona switcher in prod | `ApiGuard.verifyAccess` on **every** mutating route with per-action RBAC permissions; server derives ownership (commercial agents scoped to their accounts); offers start `DRAFT` with server-side approval provenance; persona endpoints (`/api/dev/*`) hard-403 when `NODE_ENV=production` with **no environment escape hatch**; role switcher is dev-gated in the UI and cannot obtain a real token in prod |

---

### 3. Document Intake Controls (what is actually implemented)

1. **Filename Sanitization**: path separators, `../`, null bytes and control characters rejected at the API boundary.
2. **Extension Allowlist**: `.pdf .docx .xlsx .csv .txt .png .jpg .jpeg` only, case-normalized.
3. **Size Limit**: 25 MB enforced (`MAX_FILE_SIZE_MB` is *not* read — the limit is fixed in code).
4. **Honest Scan Status**: uploads are recorded `PENDING_SCAN` — never falsely `CLEAN`.
5. **No automated extraction pipeline exists** — documents are recorded as metadata only; nothing parses or writes document contents into structured data (the `FF_AUTOMATED_EXTRACTION` feature flag was never wired). When extraction is built, its outputs must be advisory-only (`DRAFT_PENDING_VERIFICATION`-style) pending human approval.

**Not implemented (do not assume):** magic-byte/content sniffing, malware scanning, and byte-level file persistence — upload records are metadata-only. Tracked as TD-P2-03.

---

### 4. Known Threat-Model Gaps (accepted & tracked)

| Gap | Risk | Tracking |
|---|---|---|
| **No persistence** — state and audit trail vanish on restart; multi-instance deployments diverge | Availability/Repudiation: audit evidence lost; a restart is also a state-tampering vector with no detection | TD-P2-01 (top remaining debt) |
| **Session revocation** — no server-side logout/blacklist; 24 h tokens valid until expiry | Stolen-token window up to 24 h; mitigation = rotate `JWT_SECRET` (kills all sessions) | SEC-014, `docs/SECURITY.md` §2 |
| **Per-process rate limiting** — counters not shared across instances | Brute-force protection degrades if scaled horizontally | SEC-014 |
| **No CSP / no app-level HSTS** — only X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy are set | XSS blast-radius not constrained by CSP; HSTS depends on the reverse proxy | TD-P3-08 |
| **No global request throttling** beyond login | Volumetric DoS must be absorbed by proxy/infrastructure | deployment-owned |
| **Uploads not scanned or persisted** | Malicious file never actually stored (metadata only), but no scanner exists for when persistence lands | TD-P2-03 |
| **Build-time dependency advisories** (postcss-via-next, tailwind 3 chain) | Developer-workstation/build compromise, not runtime HTTP exposure | `SECURITY-AUDIT.md` §4, TD-P2-04 |
| **CI never executed on GitHub yet** | Gates are statically validated only until the repo has a remote | TD-P3-09 |
