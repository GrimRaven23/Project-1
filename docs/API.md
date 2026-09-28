# REST & OpenAPI API Specification
## TelcoQualify Enterprise API Reference

---

### 1. Base URL & Common Headers
- Base URL: `/api/v1`
- Content-Type: `application/json`
- Authentication: `Authorization: Bearer <jwt-token>` or Secure Session Cookie
- Request Tracking: `X-Correlation-ID: <uuid>`

---

### 2. Core API Endpoints

#### Authentication & User Session
- `POST /api/auth/login`: Authenticate with credentials or role switch (for demo/eval).
- `GET /api/auth/me`: Get current authenticated user, permissions, and active role.
- `POST /api/auth/logout`: Revoke session.

#### Customer & Sites Management
- `GET /api/customers`: List customers with filtering and pagination (`?page=1&limit=20&search=Aero`).
- `POST /api/customers`: Create customer record.
- `GET /api/customers/:id`: Retrieve single customer with sites and contacts.
- `POST /api/customers/:id/sites`: Add site to customer.
- `GET /api/customers/:id/assets`: List existing hardware & network baseline.
- `POST /api/customers/:id/assets`: Record an existing hardware asset (firewall, PBX, AP, link).

#### Solution Cases & Workflows
- `GET /api/cases`: List solution cases with status/priority filters.
- `POST /api/cases`: Initialize a new Solution Case.
- `GET /api/cases/:id`: Fetch complete case bundle (Sites, Assets, Questionnaire, Qualifications, Experts, BOM, Offers).
- `PATCH /api/cases/:id/transition`: Execute validated state machine transition (e.g. `INTAKE_IN_PROGRESS` -> `QUALIFICATION_IN_PROGRESS`).
- `PUT /api/cases/:id/questionnaire`: Update dynamic questionnaire responses.

#### Qualification Engine
- `POST /api/cases/:id/qualify`: Execute deterministic qualification engine against current case state and return explainable badges, rule citations, and auto-BOM suggestions.

#### Expert Workflow & Escalation
- `GET /api/experts/queue`: Retrieve expert triage queue filtered by domain (`TELEPHONY`, `NETWORK_SDWAN`, `CYBERSECURITY_FIREWALL`).
- `POST /api/cases/:id/expert-requests`: Escalate a case question to domain experts.
- `POST /api/expert-requests/:id/claim`: Expert claims the ticket.
- `POST /api/expert-requests/:id/respond`: Submit recommendation, confidential notes, and BOM components.

#### Bill of Materials (BOM) & Offers
- `GET /api/cases/:id/bom`: Retrieve structured Bill of Materials by domain with Capex/Opex totals.
- `POST /api/cases/:id/bom/items`: Add custom line item or approve suggested item.
- `POST /api/cases/:id/offers/generate`: Generate structured commercial proposal draft.
- `POST /api/cases/:id/offers/:offerId/approve`: Manager approval for commercial offer.

#### Documents & File Intake
- `POST /api/cases/:id/documents/upload`: Multipart upload with file sanitization and MIME verification.
- `POST /api/documents/:id/parse`: Trigger structured data extraction draft.
- `POST /api/documents/:id/approve-extraction`: Human validation to commit extracted values to case.

#### Audit Trail & System Health
- `GET /api/audit`: Query immutable audit trail (`?caseId=...&actorId=...`).
- `GET /api/health/liveness`: Kubernetes/Container liveness probe.
- `GET /api/health/readiness`: Database & storage readiness probe.
