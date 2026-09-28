# TelcoQualify Enterprise 🌐
### Commercial Solution-Qualification & Presales Platform for Telecom / ISP

[![CI Quality Gate](https://github.com/telecom-enterprise/telcoqualify/actions/workflows/ci.yml/badge.svg)](https://github.com/telecom-enterprise/telcoqualify/actions/workflows/ci.yml)
[![Security Scan](https://github.com/telecom-enterprise/telcoqualify/actions/workflows/security.yml/badge.svg)](https://github.com/telecom-enterprise/telcoqualify/actions/workflows/security.yml)
[![License: Proprietary / Enterprise](https://img.shields.io/badge/License-Enterprise-blue.svg)](LICENSE)
[![SemVer 2.0.0](https://img.shields.io/badge/SemVer-2.0.0-green.svg)](docs/VERSIONING.md)
[![OWASP ASVS 5.x](https://img.shields.io/badge/OWASP-ASVS%205.x-red.svg)](docs/THREAT-MODEL.md)

---

## 🎯 Executive Overview

**TelcoQualify Enterprise** is a specialized solution qualification and presales workflow platform designed for telecommunications service providers and B2B Internet Service Providers.

It empowers **Commercial Sales Representatives** (dealing with SMB / PME / PMI enterprise clients) to rapidly collect structured requirements, inventory existing customer assets, and obtain deterministic, catalog-driven qualification insights—while providing **Domain Specialists** (Network, UCaaS/Telephony, Cybersecurity, and Solutions Architects) an auditable, high-authority review workflow.

---

## 🚀 Key Functional Capabilities

1. **Structured Customer & Multi-Site Intake**: Manage organizations, site topographies, floor plans, area classifications (small offices, corridors, meeting rooms, open spaces), and contact directories.
2. **Existing Environment & Asset Delta Tracking**: Record legacy PBX, ISDN T0/T2 links, firewalls, switches, access points, and software licenses, comparing them directly against target requirements to identify: `KEEP_AS_IS`, `RENEW`, `UPGRADE`, `REPLACE`, `INCOMPATIBLE`, or `EXPERT_REVIEW_REQUIRED`.
3. **Deterministic Multi-Domain Qualification Engine**: Configurable business rules analyzing telephony, Internet/FTTH/FTTO, Wi-Fi density, and firewall capacity with transparent, human-readable explanations.
4. **Specialist Expert Escalation Workflow**: Seamlessly route complex or high-risk requirements to Network, Telephony, or Security specialists with SLA tracking and confidential note isolation.
5. **Multi-Domain Bill of Materials (BOM)**: Automatically compiles hardware, recurring connectivity lines, user licenses, and professional services into Capex/Opex breakdowns.
6. **Technical Offer & Proposal Preparation**: Generate executive technical solution summaries, risk registers, and commercial drafts.
7. **Secure Document Intake**: Controlled file upload with strict MIME-type sanitization and human-in-the-loop validation of extracted RFP data.
8. **Enterprise RBAC & Data Classification**: Role-Based Access Control protecting `SECURITY_SENSITIVE`, `CUSTOMER_CONFIDENTIAL`, and `RESTRICTED` data fields.
9. **Full Bilingual Support (i18n)**: Instant switching between **French** and **English** with localized formatting for currencies, dates, and units.
10. **Immutable Audit Trail**: Tamper-proof logging of every case state transition, expert response, document upload, and configuration change.

---

## 🛠️ Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Setup Environment Variables
cp .env.example .env.local

# 3. Launch Development Server
npm run dev
```

Visit `http://localhost:3000` to launch the interactive workspace.

---

## 📚 Complete Documentation Suite

- [Architecture & System Design](docs/ARCHITECTURE.md)
- [Role-Based Access Control (RBAC) Matrix](docs/RBAC.md)
- [Threat Model & Security Engineering](docs/THREAT-MODEL.md)
- [Qualification Engine Rules & Decision Logic](docs/QUALIFICATION-ENGINE.md)
- [Architecture Decision Records (ADRs)](docs/DECISIONS.md)
- [Developer & Contribution Guide](docs/DEVELOPMENT.md)
- [Database Schema & ERD](docs/DATABASE.md)
- [REST & OpenAPI Specification](docs/API.md)
- [CI/CD & DevSecOps Pipelines](docs/CI-CD.md)
- [Versioning & Release Governance](docs/VERSIONING.md)
- [Security Policy](docs/SECURITY.md)
