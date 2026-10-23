# TelcoQualify Enterprise — Functional Gap Analysis

> **Audit Date:** October 23, 2026  
> **Auditor Role:** Lead Software Architect & Product Systems Engineer  
> **Evaluation Framework:** Telecom / ISP B2B Commercial Presales Requirements  
>
> **Note:** §1–§2 record the **inherited state**. The **post-remediation
> re-evaluation** (same day) is in §3 — the central Customer → Contacts →
> Sites → Case lifecycle now works end-to-end through guarded server APIs.

---

## 1. Functional Status Overview

The intended business purpose of TelcoQualify Enterprise is to allow commercial sales teams to collect business customer requirements across telephony, fiber, Wi-Fi, and cybersecurity, assess existing customer assets, run deterministic qualification rules, escalate complex decisions to specialists, and compile an accurate Bill of Materials (BOM) and commercial offer draft.

| Business Capability | Status | Assessment |
| :--- | :---: | :--- |
| **Customer Creation** | **MISSING** | No UI form or modal to create a customer. The `/customers` page only displays a hardcoded list of cards. |
| **Customer Management** | **PARTIAL** | View-only card list; no contact editing, no site management, and no customer archive/status lifecycle. |
| **Contact Management** | **PLACEHOLDER** | Single static contact displayed per customer card; no mechanism to add technical, financial, or administrative contacts. |
| **Site Management** | **INCORRECT** | Case creation `/cases/new` hardcodes a single dummy Paris HQ site instead of selecting from customer sites. |
| **Solution Case Creation** | **INCORRECT** | Hardcoded site topography (650 m², 40 staff) and hardcoded questionnaire answers pre-filled on submission. |
| **Solution Case Detail** | **IMPLEMENTED** | Multi-tab workspace exists (`/cases/[id]`), but directly mutates in-browser memory instead of server APIs. |
| **Dynamic Questionnaire** | **PARTIAL** | Complex form exists (`QuestionnaireForm.tsx`) with telephony/network/wifi/firewall inputs, but lacks versioning or conditional child question rendering. |
| **Telephony Domain** | **IMPLEMENTED** | Sizing for endpoints, categories, ISDN T0/T2 migrations, SIP trunks, and QoS switches supported in rules. |
| **Network & FTTO Domain** | **IMPLEMENTED** | Symmetrical bandwidth sizing, 4h GTR rules, and 4G/5G failover cellular backup rules implemented. |
| **Wi-Fi 6 & Captive Portal** | **IMPLEMENTED** | Topography calculation for AP density and GDPR-compliant guest portal license requirements implemented. |
| **Cybersecurity / Firewall** | **IMPLEMENTED** | FortiGate model replacement rules, UTM renewal rules, and mandatory expert escalation for SSL deep inspection. |
| **Existing vs Desired Assets** | **PARTIAL** | Existing hardware types exist, but UI does not provide an interactive inventory editor to register serials/warranties. |
| **Expert Review Workflow** | **PARTIAL** | Triage queue exists (`/experts`) and modal allows responses, but client bypasses server `/api/cases/[id]/expert-request`. |
| **Qualification Engine** | **IMPLEMENTED** | Deterministic rule orchestrator (`QualificationEngine`) emits explainable badges and rule citations. |
| **Product/Service Catalog** | **PARTIAL** | View-only catalog page with SKU search; lacks administrative creation or lifecycle editing in the UI. |
| **Bill of Materials (BOM)** | **IMPLEMENTED** | Multi-domain BOM table calculates CAPEX and monthly OPEX with mandatory/optional tags and rule citations. |
| **Offer Drafting & Approval** | **PARTIAL** | Offer draft view calculates totals and manager sign-off, but actions bypass the backend `/api/cases/[id]/offer`. |
| **Document Intake** | **PLACEHOLDER** | File uploader UI accepts drag-and-drop, but files are not uploaded to object storage; metadata is appended to memory. |
| **Role-Based Access Control** | **BROKEN** | UI features persona switcher that bypasses all security; server `ApiGuard` accepts spoofed `x-user-role` headers. |
| **Audit Logging** | **PARTIAL** | `AuditService` logs correlation IDs, but logs are stored in memory and lost on restart. UI bypasses server route. |
| **Administration** | **PLACEHOLDER** | `/admin` page displays a static table of permissions and seed users with no user or role management actions. |
| **Search & Filtering** | **PARTIAL** | Client-side array filtering on loaded cases/catalog; no authorized server-side database search. |
| **Notifications** | **PLACEHOLDER** | Bell icon with simulated badge in navbar; no persistent notification store or WebSocket/SSE push. |
| **Internationalization (i18n)** | **IMPLEMENTED** | Full English and French translation dictionaries with dynamic language switcher. |
| **Commercial Reporting** | **PLACEHOLDER** | Dashboard displays calculated metrics from memory; no exportable PDF/Excel summary reports. |

---

## 2. Core Defect: The Broken Customer $\rightarrow$ Case Lifecycle

The primary business requirement dictates the following flow:
```
Authorized Commercial Agent
  └── 1. Create New Customer (Legal Name, SIREN/VAT, Industry Segment, Contacts, Sites)
        └── 2. Select Customer & Registered Site(s)
              └── 3. Create Customer Solution Case (Real Topography & Real Needs)
                    └── 4. Fill Technical Questionnaire (Telephony, Fiber, Wi-Fi, Security)
                          └── 5. Run Deterministic Qualification
                                └── 6. Escalate Complex Architecture to Domain Specialists
                                      └── 7. Specialist Responds with Technical Recommendation
                                            └── 8. Generate Multi-Domain BOM & Commercial Offer Draft
                                                  └── 9. Commercial Manager Review & Sign-off
```

In the inherited implementation:
- Step 1 cannot be performed in the UI (no customer creation button or form).
- Step 2 and 3 automatically inject hardcoded fake site metrics (Paris HQ 650 m²) and fake questionnaire data.
- Step 4 to 9 execute against isolated browser memory rather than calling authenticated server endpoints.

**Remediation Requirement:** Re-architect the frontend and backend to restore this exact end-to-end business flow.

---

## 3. Post-Remediation Re-Evaluation (October 23, 2026)

The core defect above was repaired the same day. Re-verified status of every capability (✔ = verified by live HTTP or test, ⚠ = partially, ✗ = still missing):

| Business Capability | Before | After | Evidence |
| :--- | :---: | :---: | :--- |
| **Customer Creation** | MISSING | ✔ | `/customers` create form → `POST /api/customers` (zod-validated, duplicate SIREN/VAT detection → 409) |
| **Customer Management** | PARTIAL | ✔ | `GET/PUT/DELETE /api/customers/[id]` with `customers:update` RBAC + ownership scoping |
| **Contact Management** | PLACEHOLDER | ✔ | New `Contact` entity; list/create/delete under `/api/customers/[id]/contacts` incl. duplicate-email detection and primary-contact invariants |
| **Site Management** | INCORRECT | ✔ | Site CRUD under `/api/customers/[id]/sites` with referential checks (deletion blocked while cases reference the site) |
| **Solution Case Creation** | INCORRECT | ✔ | `/cases/new` selects the real customer and its real sites, captures real questionnaire inputs; server assigns case number, owner, initial state through `CaseStateMachine` |
| **Solution Case Detail** | IMPLEMENTED | ✔ | Workspace driven by `/api/cases/[id]` (+ qualify/BOM/expert/offer/documents sub-resources); server-side masking and IDOR scoping now apply |
| **Dynamic Questionnaire** | PARTIAL | ⚠ | Real inputs captured & validated (zod); still no question versioning or conditional child rendering |
| **Telephony / Network / Wi-Fi / Cyber Domains** | IMPLEMENTED | ✔ | Unchanged deterministic rules; qualification route walks legal lifecycle hops (`INTAKE → QUALIFICATION_IN_PROGRESS → outcome`) |
| **Existing vs Desired Assets** | PARTIAL | ⚠ | Still no interactive serial/warranty inventory editor |
| **Expert Review Workflow** | PARTIAL | ✔ | `POST /api/cases/[id]/expert-request` enforced with `expert_requests:respond`; assignment-based access correctly scoped (regression-tested) |
| **Qualification Engine** | IMPLEMENTED | ✔ | Unchanged + hop-by-hop state enforcement |
| **Product/Service Catalog** | PARTIAL | ⚠ | Read path requires `catalog:view`; no admin creation UI (catalog entries remain clearly-labelled `(Demo)` fixtures) |
| **Bill of Materials (BOM)** | IMPLEMENTED | ✔ | `POST /api/cases/[id]/bom` generates server-side; client cannot submit its own totals |
| **Offer Drafting & Approval** | PARTIAL | ✔ | Offers always start `DRAFT`; totals and approval provenance server-derived; manager actions via guarded endpoints |
| **Document Intake** | PLACEHOLDER | ⚠ | Upload validates extension allowlist + 25 MB limit + path/control chars, records `PENDING_SCAN` honestly; **no file bytes persisted** (metadata-only) and no malware scanner |
| **Role-Based Access Control** | BROKEN | ✔ | Header bypass removed; cookie JWT + store-backed role; IDOR 404-scoping; `customers:view_all` grant matrix tested |
| **Audit Logging** | PARTIAL | ⚠ | Every mutation logs actor/role/before/after; clamped reads (≤500); **still in-memory** (lost on restart) |
| **Administration** | PLACEHOLDER | ⚠ | `/admin` still a read-only permission/user directory (no user lifecycle actions) |
| **Search & Filtering** | PARTIAL | ⚠ | Server-side list filtering exists for cases/customers, but shallow (no full-text/sort pagination) |
| **Notifications** | PLACEHOLDER | ✗ | Still simulated badge only |
| **Internationalization (i18n)** | IMPLEMENTED | ✔ | Unchanged |
| **Commercial Reporting** | PLACEHOLDER | ✗ | No exports/PDF |

### End-to-End Flow (steps 1–9 from §2)

| Step | Status |
| :--- | :---: |
| 1. Create Customer (with contacts) | ✔ UI + guarded API + duplicate detection |
| 2. Select Customer & registered Site(s) | ✔ real sites fetched and selectable |
| 3. Create Solution Case from that customer/site | ✔ server-derived number/owner/state |
| 4. Fill real technical questionnaire | ✔ real inputs captured & validated |
| 5. Run deterministic qualification | ✔ legal lifecycle hops enforced |
| 6. Escalate to domain specialists | ✔ guarded expert-request endpoint |
| 7. Specialist recommendation | ✔ (role-scoped; confidential notes masked) |
| 8. Generate BOM & offer draft | ✔ server-computed, offers start DRAFT |
| 9. Commercial Manager sign-off | ✔ via guarded offer approval endpoint |

**Remaining functional gaps (tracked):** persistence (TD-P2-01), upload byte storage + scanning (TD-P2-03), catalog admin UI, asset inventory editor, notifications, exports, admin user lifecycle, E2E tests — see `TECHNICAL-DEBT.md`.
