# Security Policy & Vulnerability Management
## TelcoQualify Enterprise DevSecOps

---

### 1. Supported Versions
| Version | Supported | Security Patches |
|---|---|---|
| `1.0.x` | Yes | Active |
| `< 1.0` | No | Pre-production |

---

### 2. Incident Response Workflow

As actually implementable on the current architecture (the earlier revision
described Prometheus/Sentry alerting and a Redis session blacklist — none of
which exist):

1. **Detection**: audit trail (`/audit` page, in-memory audit log), CI/CD
   security workflows (CodeQL, Trivy, Gitleaks, daily `npm audit`), or an
   external report.
2. **Containment**:
   - **Rotate `JWT_SECRET`** — every session JWT becomes invalid immediately
     (sessions are stateless signed tokens; there is no server-side
     revocation list, so rotation is the kill switch).
   - Set a user's `isActive: false` — rejected with 403 on every
     authenticated request (role and active state are read from the user
     store per request, not trusted from the token).
   - For credential stuffing: the per-IP/per-email login rate limiter
     (5 failures / 15 min → 429) mitigates ongoing guessing — note it is
     per-process only.
3. **Remediation**: fix on an isolated `security/*` branch; merge only with
   the full CI quality gate green (typecheck, lint with zero warnings, both
   test suites, production build).
4. **Disclosure**: publish a GitHub Security Advisory (CVE when applicable)
   and notify affected deployers.

---

### 3. Reporting a Vulnerability

Report suspected vulnerabilities through this repository's **GitHub Security
Advisory** flow: *Security → Report a vulnerability*, including reproduction
steps and impact analysis. Do not open a public issue for exploitable
findings.

---

### 4. Security Control Reference

| Control | Where |
|---|---|
| Session storage: HttpOnly / SameSite=Lax cookie only | `src/core/security/jwt.ts`, `/api/auth/login` |
| RBAC permission matrix | `src/core/security/rbac.ts`, `docs/RBAC.md` |
| IDOR record scoping (404 for out-of-scope) | `src/core/security/api-guard.ts` |
| Request body validation (zod whitelists) | every `src/app/api/**/route.ts` |
| Production secrets hard-fail | `src/core/security/jwt.ts` (`JWT_SECRET` missing/short) |
| Dev persona endpoints blocked in production | `src/lib/dev/dev-guard.ts` |
| Login brute-force limiting | `/api/auth/login` (in-memory sliding window) |
| Security headers | `next.config.mjs` |
| Full threat model | `docs/THREAT-MODEL.md` |
| Audit findings & remediation history | `docs/audits/` |
