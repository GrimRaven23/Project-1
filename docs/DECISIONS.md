# Architecture Decision Records (ADRs)
## TelcoQualify Enterprise Decision Log

---

### ADR-001: Monorepo & Clean Modular Monolith Architecture
* **Status**: Accepted
* **Context**: The platform coordinates multiple complex telecom domains (telephony, network, Wi-Fi, security, catalog, qualification, RBAC, documents, and audit). Microservices at this stage would introduce distributed transactions, deployment friction, network latency, and operational overhead.
* **Decision**: Adopt a Clean Modular Monolith with bounded domains in `@/core` and modern full-stack web integration.
* **Consequences**: Fast development, atomic transactional consistency, shared type safety across frontend and backend, simple single-command local testing, while maintaining strict isolation between domain modules for future microservice extraction if needed.

---

### ADR-002: Deterministic Rule Engine with Explainability Badges
* **Status**: Accepted
* **Context**: Commercial representatives frequently propose incompatible hardware or overpromise ISP bandwidth without understanding SLA implications or existing customer hardware state.
* **Decision**: All automated qualification evaluations must execute deterministic rule pipelines linking inputs to catalog criteria, with explicit rule identifiers and transparent French/English explanations.
* **Consequences**: Commercial reps gain instant, explainable technical confidence; technical authority is preserved; no "black box" decisions.

---

### ADR-003: Field-Level Data Classification & Expert Note Isolation
* **Status**: Accepted
* **Context**: Security specialists often document sensitive customer vulnerabilities, internal network topologies, or draft pricing that commercial reps or outside parties should not access.
* **Decision**: Implement Information Classifications (`SECURITY_SENSITIVE`, `RESTRICTED`, `CUSTOMER_CONFIDENTIAL`, `INTERNAL`, `PUBLIC`) and enforce automatic serialization stripping in backend API handlers.
* **Consequences**: Absolute data protection and strict compliance with OWASP ASVS 5.x and enterprise confidentiality standards.

---

### ADR-004: Dual-Store Persistence (PostgreSQL for Prod / Embedded Engine for Zero-Friction Dev)
* **Status**: Accepted
* **Context**: The platform must support production PostgreSQL with strong foreign keys, transactional integrity, and migrations, while enabling instant local developer bootstrapping without requiring external database setup.
* **Decision**: Implement repository patterns supporting PostgreSQL via connection string and file-based/embedded SQLite storage for zero-dependency local development and testing.
* **Consequences**: Developers can run `npm run dev` immediately; production deploys directly to managed PostgreSQL.
