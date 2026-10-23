# TelcoQualify Enterprise 🌐

### Commercial Solution-Qualification & Presales Platform for Telecom / ISP

[![CI Quality Gate](https://github.com/GrimRaven23/Project-1/actions/workflows/ci.yml/badge.svg)](https://github.com/GrimRaven23/Project-1/actions/workflows/ci.yml)
[![Security Scan](https://github.com/GrimRaven23/Project-1/actions/workflows/security.yml/badge.svg)](https://github.com/GrimRaven23/Project-1/actions/workflows/security.yml)
[![License: Proprietary / Enterprise](https://img.shields.io/badge/License-Enterprise-blue.svg)](LICENSE)
[![SemVer](https://img.shields.io/badge/SemVer-1.0.0-green.svg)](docs/VERSIONING.md)
[![OWASP ASVS](https://img.shields.io/badge/OWASP-ASVS%205.x-red.svg)](docs/THREAT-MODEL.md)

---

## 🎯 Executive Overview

**TelcoQualify Enterprise** is a specialized, enterprise-grade solution qualification and presales workflow platform designed for telecommunications service providers and B2B Internet Service Providers.

It empowers **Commercial Sales Representatives** (dealing with SMB / PME / PMI enterprise clients) to rapidly collect structured requirements, inventory existing customer assets, and obtain deterministic, catalog-driven qualification insights — while providing **Domain Specialists** (Network, UCaaS/Telephony, Cybersecurity, and Solutions Architects) an auditable, high-authority review workflow.

### What This Platform Is

This is NOT merely a CRM, ticketing system, or quote generator. It **combines** structured intake, qualification intelligence, expert escalation, BOM generation, and offer preparation into a **single presales workflow**:

1. Collect structured customer requirements (telephony, network, Wi-Fi, security)
2. Record what the customer already owns (existing equipment, licenses, contracts)
3. Evaluate requirements against a deterministic qualification engine with explainable results
4. Route complex technical decisions to domain specialists (network, telephony, security experts)
5. Generate structured Bill of Materials (BOM) with Capex/Opex breakdowns
6. Prepare technically coherent commercial offers
7. Maintain a complete, immutable audit trail of all actions

---

## 🚀 Key Functional Capabilities

| # | Capability | Description |
|---|-----------|-------------|
| 1 | **Structured Customer & Multi-Site Intake** | Manage organizations, site topographies, floor plans, area classifications, and contact directories |
| 2 | **Asset Delta Tracking** | Record legacy PBX, ISDN T0/T2, firewalls, switches, APs, and licenses — compare against target to identify: `KEEP_AS_IS`, `RENEW`, `UPGRADE`, `REPLACE`, `INCOMPATIBLE`, or `EXPERT_REVIEW_REQUIRED` |
| 3 | **Deterministic Multi-Domain Qualification Engine** | Configurable business rules analyzing telephony, Internet/FTTH/FTTO, Wi-Fi density, and firewall capacity with transparent, human-readable explanations |
| 4 | **Expert Escalation Workflow** | Route complex requirements to Network, Telephony, or Security specialists with SLA tracking and confidential note isolation |
| 5 | **Multi-Domain BOM** | Auto-compile hardware, connectivity lines, user licenses, and professional services into Capex/Opex breakdowns |
| 6 | **Offer Preparation** | Generate executive technical solution summaries, risk registers, and commercial drafts |
| 7 | **Secure Document Intake** | Controlled file upload with strict MIME-type sanitization and human-in-the-loop validation |
| 8 | **Enterprise RBAC** | Role-Based Access Control protecting `SECURITY_SENSITIVE`, `CUSTOMER_CONFIDENTIAL`, and `RESTRICTED` data fields |
| 9 | **Full Bilingual i18n** | Instant switching between **French** and **English** with localized formatting |
| 10 | **Full Audit Trail** | Every case state transition, expert response, and configuration change is logged with actor, role, timestamp, and before/after state (see [Known Limitations](#-known-limitations) on durability) |

---

## 🏗️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 15.5.x |
| **UI** | React + TypeScript | 18.3.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **Icons** | Lucide React | 0.453.x |
| **Validation** | Zod | 3.23.x |
| **Auth Utilities** | bcryptjs, jsonwebtoken | Latest stable |
| **Testing** | Vitest + Testing Library | 5.x |
| **Runtime** | Node.js | 24.x LTS |
| **Container** | Docker + Docker Compose | Multi-stage Alpine |
| **Datastore** | In-memory repository (seeded per process) | See [Known Limitations](#-known-limitations) |
| **CI/CD** | GitHub Actions | 4 workflows |

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| **Node.js** | 24.x LTS | `node --version` |
| **npm** | 10.x | `npm --version` |
| **Git** | 2.40+ | `git --version` |
| **Docker** *(optional, for containers)* | 24.x | `docker --version` |
| **Docker Compose** *(optional, for containers)* | 2.x | `docker compose version` |

### Install Node.js

- **Windows**: Download from [nodejs.org](https://nodejs.org/) (LTS 24.x recommended)
- **macOS**: `brew install node@24`
- **Linux (Ubuntu/Debian)**: 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

---

## ⚡ Quick Start (Development)

### 1. Clone the Repository

```bash
git clone https://github.com/GrimRaven23/Project-1.git
cd Project-1
```

### 2. Install Dependencies

```bash
npm install
```

> This will install all production and development dependencies and generate a `package-lock.json` lockfile for reproducible builds.

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# The ONLY secret the application reads. Session JWTs are signed with it.
# Dev falls back to a built-in dev-only key; production startup FAILS if
# missing or shorter than 32 characters.
JWT_SECRET=super-secret-dev-jwt-key-change-in-production-min-32-chars-long!
```

> ⚠️ **IMPORTANT**: Never commit `.env.local` to version control. The `.gitignore` already excludes it.
>
> **Note**: outside production the datastore seeds itself on first use with
> clearly fictional demo data (`@example.test` personas, "(Demo)" customers).
> In production the app starts empty unless `TELCO_ALLOW_SEEDING=true` is
> explicitly set — never do that in a real deployment.

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### 5. Explore the Application

Once running, you can navigate to:

| Page | URL | Description |
|------|-----|-------------|
| **Dashboard** | `/` | KPI cards, recent cases, expert queue overview |
| **Cases** | `/cases` | List all solution qualification cases |
| **New Case** | `/cases/new` | Create a new customer solution case |
| **Case Detail** | `/cases/[id]` | Full tabbed workspace: qualification, BOM, documents, offers |
| **Customers** | `/customers` | Customer directory |
| **Catalog** | `/catalog` | Product & service catalog browser |
| **Expert Queue** | `/experts` | Specialist triage and escalation queue |
| **Audit Log** | `/audit` | Immutable audit trail viewer |
| **Admin** | `/admin` | Platform administration panel |

#### Demo Access (Development Only)

The application ships with **clearly fictional demo personas** (`*@example.test`,
names like "Commercial Agent (Demo)") that are seeded automatically outside
production. Sign in with any of them — they all share this demo password:

```
Email:    commercial.demo@example.test
Password: TelecomDemo2026!
```

The full persona list is served by `GET /api/dev/personas` — a **dev-only**
endpoint that hard-returns 403 when `NODE_ENV=production`.

#### Role Switching (Development)

When running outside production, a **Role Switcher** appears in the
navigation bar after login. It issues a real signed session for the selected
demo persona (via `/api/dev/switch`) so you can see how the interface adapts:

- `COMMERCIAL_AGENT` — Standard commercial user (scoped to own accounts/cases)
- `COMMERCIAL_MANAGER` — Manager with approval authority
- `PRESALES_ENGINEER` — Technical solution design
- `NETWORK_EXPERT` — Network/SD-WAN domain specialist
- `TELEPHONY_EXPERT` — Telephony/UCaaS specialist
- `SECURITY_EXPERT` — Cybersecurity/firewall specialist
- `PLATFORM_ADMIN` — Full administrative access
- `AUDITOR_COMPLIANCE` — Read-only audit access

> There is **no environment-variable escape hatch**: in production the
> switcher and the dev endpoints are disabled unconditionally.

#### Language Switching

Toggle between **French** and **English** using the language switcher in the top navigation bar. All UI labels, validation messages, and formatting (dates, currencies) update instantly.

---

## 🔨 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server (requires build first) |
| `npm run lint` | Run ESLint static code analysis (zero warnings tolerated) |
| `npm run typecheck` | Run TypeScript strict type checking |
| `npm run test` | Run **both** test suites (custom business rules + Vitest) |
| `npm run test:custom` | Run only the custom business-rule harness |
| `npm run test:unit` | Run only the Vitest unit/integration suite |
| `npm run test:watch` | Vitest in watch mode |

---

## 🏗️ Building for Production

### Option A: Standalone Node.js Build

```bash
# 1. Install production dependencies
npm ci

# 2. Build the optimized production bundle
npm run build

# 3. Start the production server
npm run start
```

The production server runs on port `3000` by default (configurable via `PORT` env variable).

### Option B: Docker Build

```bash
# Build the Docker image
docker build -f docker/Dockerfile -t telcoqualify:latest .

# Run the container
docker run -p 3000:3000 \
  -e JWT_SECRET="your-production-secret-here-min-32-chars!" \
  -e NODE_ENV=production \
  telcoqualify:latest
```

### Option C: Docker Compose

Compose starts the app **plus Postgres and Redis services**. Note that the
application currently uses an **in-memory repository** and does *not* connect
to Postgres/Redis yet — those services are provisioned for the future
persistent-datastore milestone (see [Known Limitations](#-known-limitations)).

Secrets are **not committed**: compose reads them from
`docker/docker-compose.env` (gitignored) and fails fast if they are missing.

```bash
# 1. Provide secrets (once)
cp docker/docker-compose.env.example docker/docker-compose.env
#    ...then edit it: set POSTGRES_* and a >=32-char JWT_SECRET

# 2. Start all services
docker compose -f docker/docker-compose.yml up -d --build

# View logs
docker compose -f docker/docker-compose.yml logs -f app

# Stop all services
docker compose -f docker/docker-compose.yml down
```

**Services started by Docker Compose:**

| Service | Port | Description |
|---------|------|-------------|
| `telcoqualify-app` | 3000 | Next.js application |
| `telcoqualify-db` | 5432 *(loopback only)* | PostgreSQL 16 — reserved; not yet wired into the app |
| `telcoqualify-redis` | 6379 *(loopback only)* | Redis 7 — reserved; not yet wired into the app |

---

## 🧪 Testing

### Run All Tests

```bash
npm run test
```

### Test Coverage

`npm run test` runs two harnesses (and CI gates on both):

1. **Custom business-rule harness** (`scripts/test-runner.mjs`, 26 assertions) —
   qualification rules, state machine, RBAC, masking, JWT behaviour
2. **Vitest unit/integration suite** (`src/**/*.test.ts`, 30 tests):

| Test File | Domain | What It Tests |
|-----------|--------|--------------|
| `qualification-engine.test.ts` | Core Logic | Deterministic qualification rules across telephony, network, Wi-Fi, and security domains |
| `rbac.test.ts` | Security | Role-based permission enforcement, action authorization per role |
| `case-state-machine.test.ts` | Workflow | Valid/invalid state transitions in the case lifecycle |
| `api-guard.test.ts` | Security | Authentication guard, `customers:view_all` grant matrix, IDOR record scoping, seed-data hygiene |

### Type Checking

```bash
npm run typecheck
```

This runs TypeScript in strict mode (`noEmit`) to verify all types without producing output files.

---

## 🚢 Deployment Guide

### Environment Requirements

| Environment | Purpose | Datastore |
|-------------|---------|-----------|
| **Development** | Local coding & testing | In-memory repository, seeded with fictional demo data |
| **Staging / Production** | Deployed evaluation | In-memory repository, **starts empty** (no seeding) — data does not survive a restart |

> ⚠️ The platform does **not** yet persist data. Treat it as a workflow
> demonstration, not a system of record, until the persistent-datastore
> milestone lands (see [Known Limitations](#-known-limitations)).

### Production Environment Variables

> ⚠️ **All secrets must be injected via environment variables or a secrets manager. Never commit production credentials.**

```env
# Required for Production
NODE_ENV=production

# Security (MUST change from defaults!)
# The application refuses to start in production without it (or if < 32 chars).
JWT_SECRET=<generate-a-secure-64-char-random-string>
```

Any other variables (`PORT`, `APP_URL`, `DATABASE_*`, `STORAGE_*`, `LOG_LEVEL`, feature flags) are **not read by the application** — configuring them has no effect. `.env.example` documents the real surface.

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate a strong `JWT_SECRET` (minimum 32 characters): `openssl rand -base64 48`
- [ ] Confirm `TELCO_ALLOW_SEEDING` is **unset** (default: production starts clean)
- [ ] Set proper `APP_URL` with HTTPS
- [ ] Configure reverse proxy (Nginx/Caddy) with TLS
- [ ] Enable HSTS headers
- [ ] Plan for **volatile state** (see Known Limitations) or add a reverse-proxy sticky single-instance topology
- [ ] Configure log aggregation
- [ ] Set up health check monitoring at `/api/health/liveness`
- [ ] Review and apply security headers in `next.config.mjs`

### Health Check Endpoint

The application exposes a health check at:

```
GET /api/health/liveness
```

Returns `200 OK` with `{ "status": "healthy", "timestamp": "...", "service": "telcoqualify-core", "version": "1.0.0", "uptimeSeconds": ... }`. Use this for load balancer health checks and container orchestration.

### Recommended Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name telcoqualify.yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📁 Project Structure

```
telcoqualify-enterprise/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI quality gate (lint, typecheck, test, build)
│       ├── security.yml            # SAST: Gitleaks + CodeQL + Trivy
│       ├── daily-security.yml      # Daily dependency vulnerability audit
│       └── release.yml             # Production release + SBOM generation
├── docker/
│   ├── Dockerfile                  # Multi-stage production container
│   ├── docker-compose.yml          # app + reserved Postgres/Redis services (env-driven secrets)
│   └── docker-compose.env.example  # Template for gitignored docker-compose.env
├── docs/
│   ├── ARCHITECTURE.md             # System design & component diagram
│   ├── RBAC.md                     # Role permission matrix
│   ├── DATABASE.md                 # Data model & storage strategy
│   ├── API.md                      # REST API surface documentation
│   ├── SECURITY.md                 # Security policy
│   ├── THREAT-MODEL.md             # STRIDE threat analysis
│   ├── QUALIFICATION-ENGINE.md     # Rule engine specification
│   ├── DECISIONS.md                # Architecture Decision Records
│   ├── VERSIONING.md               # SemVer & release strategy
│   ├── CI-CD.md                    # Pipeline documentation
│   ├── DEVELOPMENT.md              # Developer onboarding guide
│   └── audits/                     # Inherited-state audit & remediation deliverables
├── scripts/
│   ├── test-runner.mjs             # Custom business-rule test harness
│   └── fix-node-modules.mjs        # Node modules repair utility
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout (providers, navbar, sidebar)
│   │   ├── page.tsx                # Dashboard (KPIs, recent cases, expert queue)
│   │   ├── globals.css             # Global styles + Tailwind directives
│   │   ├── admin/page.tsx          # Admin panel
│   │   ├── audit/page.tsx          # Audit log viewer
│   │   ├── cases/                  # Case management pages
│   │   │   ├── page.tsx            # Case list
│   │   │   ├── new/page.tsx        # New case creation wizard
│   │   │   └── [id]/page.tsx       # Case detail (tabbed workspace)
│   │   ├── catalog/page.tsx        # Product catalog browser
│   │   ├── customers/page.tsx      # Customer directory
│   │   ├── experts/page.tsx        # Expert triage queue
│   │   └── api/                    # API routes
│   │       ├── cases/route.ts      # POST /api/cases
│   │       ├── cases/[id]/qualify/ # POST /api/cases/[id]/qualify
│   │       └── health/liveness/    # GET /api/health/liveness
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # Primitives: Button, Badge, Card, Modal, Tabs
│   │   ├── layout/                 # Navbar, Sidebar, Role/Language switchers
│   │   ├── forms/                  # Questionnaire form engine (18KB)
│   │   ├── bom/                    # Bill of Materials table
│   │   ├── cases/                  # Case timeline
│   │   ├── documents/              # Document uploader
│   │   ├── experts/                # Expert triage modal
│   │   ├── offers/                 # Offer view component
│   │   └── qualification/          # Qualification results view
│   ├── core/                       # Business logic (framework-agnostic)
│   │   ├── domain/types.ts         # Complete type system (345 lines)
│   │   ├── qualification/          # Deterministic qualification engine
│   │   │   ├── qualification-engine.ts
│   │   │   └── rules/              # Domain rule modules
│   │   │       ├── telephony-rules.ts
│   │   │       ├── network-rules.ts
│   │   │       ├── wifi-rules.ts
│   │   │       └── security-rules.ts
│   │   ├── state-machine/          # Case lifecycle state machine
│   │   ├── security/               # RBAC + data masking
│   │   ├── audit/                  # Immutable audit logger
│   │   ├── catalog/                # Product/service catalog engine
│   │   └── storage/                # Database repository + seed data
│   └── lib/                        # Shared utilities
│       ├── utils.ts                # Formatting helpers
│       ├── auth/auth-context.tsx   # Auth provider (RBAC role context)
│       └── i18n/                   # Internationalization (FR/EN)
│           ├── context.tsx         # i18n provider
│           ├── en.ts               # English translations
│           ├── fr.ts               # French translations
│           └── types.ts            # Translation key types
├── .env.example                    # Environment variable template
├── .gitignore                      # Git exclusions
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript strict config
├── tailwind.config.ts              # Design system tokens
├── postcss.config.js               # PostCSS config
└── next.config.mjs                 # Next.js config (security headers)
```

---

## 🔒 Security Architecture

### Security Headers (Applied Automatically)

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restrict browser APIs |

### CI/CD Security Pipelines

| Pipeline | Schedule | Tools |
|----------|----------|-------|
| **CI Quality Gate** | Every push/PR | TypeScript, ESLint, Vitest, Next.js build |
| **SAST Security** | Every push/PR to `main` | Gitleaks, CodeQL, Trivy |
| **Daily Audit** | 04:00 UTC daily | `npm audit --audit-level=high` |
| **Release** | On version tags | Docker build, CycloneDX SBOM |

### RBAC Roles

See [docs/RBAC.md](docs/RBAC.md) for the complete permission matrix.

| Role | Access Level |
|------|-------------|
| `SUPER_ADMIN` | Full platform control |
| `PLATFORM_ADMIN` | Configuration & user management |
| `COMMERCIAL_AGENT` | Customer cases & standard catalog |
| `COMMERCIAL_MANAGER` | Agent scope + approval authority |
| `PRESALES_ENGINEER` | Technical solution design |
| `NETWORK_EXPERT` | Network domain specialist |
| `TELEPHONY_EXPERT` | Telephony domain specialist |
| `SECURITY_EXPERT` | Security domain specialist |
| `OPERATIONS_PROVISIONING` | Deployment & provisioning |
| `AUDITOR_COMPLIANCE` | Read-only audit access |

---

## ⚠️ Known Limitations

Verified during the 2026-10 inherited-state audit (details in
[docs/audits/](docs/audits/)):

1. **No persistent datastore.** All state (users, customers, cases, audit
   trail, uploads index) lives in an in-memory repository seeded per process.
   A restart wipes changes; audit history is not durable; running multiple
   instances produces divergent data. Compose ships Postgres/Redis services,
   but the application does not connect to them yet.
2. **Login brute-force protection is per-process.** The failure window lives
   in process memory — it resets on restart and is not shared across
   instances. Put a shared limiter (edge/Redis) in front of it before scaling
   out.
3. **Document uploads are not malware-scanned.** New uploads start as
   `PENDING_SCAN` (previously they were falsely marked `CLEAN`). Content is
   type/extension-checked on upload, but no real scanner is wired in.
4. **Catalog pricing and network/security rule fixtures are development
   fixtures**, clearly labelled `(Demo)` — not a production product catalog.
5. **CI history on GitHub was poor and is only now corrected.** The public
   repo's default branch is `main`; this working copy had been left on a
   local-only `master` with no remote. GitHub's run history shows the CI
   Quality Gate failed 3/3 runs (missing ESLint config), the Security
   pipeline "passed" only because Trivy was non-gating, and the daily audit
   failed 25/25 days on open CVEs. All three are now fixed (retargeted
   triggers, gating scans with a documented accepted-risk list) — the first
   push after remediation must be watched to confirm them green.
6. **Known residual npm audit findings** (5, documented in
   `docs/audits/SECURITY-AUDIT.md`): `postcss` bundled inside `next` and the
   `tailwindcss@3` build-time chain. Both are build-time CSS tooling over
   developer-authored input; upgrading would require breaking majors
   (`next@16`, `tailwindcss@4`).

---

## 📚 Documentation Suite

| Document | Description |
|----------|-------------|
| [Architecture & System Design](docs/ARCHITECTURE.md) | Component diagram, data flow, deployment architecture |
| [RBAC Permission Matrix](docs/RBAC.md) | Complete role-permission mapping |
| [Threat Model](docs/THREAT-MODEL.md) | STRIDE analysis, trust boundaries, mitigations |
| [Qualification Engine](docs/QUALIFICATION-ENGINE.md) | Rule engine design, domain rules, escalation logic |
| [Database Schema](docs/DATABASE.md) | Data model, entity relationships, indexing strategy |
| [REST API](docs/API.md) | API endpoints, request/response schemas |
| [Security Policy](docs/SECURITY.md) | OWASP ASVS baseline, security controls |
| [CI/CD Pipelines](docs/CI-CD.md) | Pipeline architecture, quality gates |
| [Development Guide](docs/DEVELOPMENT.md) | Developer onboarding, coding standards |
| [Architecture Decisions](docs/DECISIONS.md) | ADRs for key technical choices |
| [Versioning](docs/VERSIONING.md) | SemVer policy, release governance |

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `security:`, `docs:`, `test:`, `chore:`
3. Ensure all checks pass: `npm run typecheck && npm run lint && npm run test`
4. Build successfully: `npm run build`
5. Push and create a Pull Request against `main`

---

## 📄 License

Proprietary — Enterprise Internal Use Only.

---

*Built with ❤️ for Telecom B2B Commercial Excellence*
