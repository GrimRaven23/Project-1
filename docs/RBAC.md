# Role-Based Access Control (RBAC) & Security Policy
## TelcoQualify Enterprise Permission Matrix

---

### 1. User Roles

The platform defines structured enterprise roles corresponding to telecom organizational hierarchies:

| Role Identifier | Role Name | Purpose / Scope |
|---|---|---|
| `SUPER_ADMIN` | Super Administrator | Full platform control, security settings, tenant configuration |
| `PLATFORM_ADMIN` | Platform Administrator | Catalog management, rule configuration, user administration |
| `COMMERCIAL_AGENT` | Commercial Sales Representative | Case creation, intake questionnaire, client summaries, standard catalog |
| `COMMERCIAL_MANAGER` | Commercial Sales Manager | Team case assignment, quota reviews, offer approvals, deal status |
| `PRESALES_ENGINEER` | Presales / Solution Architect | Multi-domain qualification, solution design, BOM assembly |
| `NETWORK_EXPERT` | Network & SD-WAN Specialist | Fiber/WAN eligibility, routing reviews, Wi-Fi coverage validation |
| `TELEPHONY_EXPERT` | Telephony & UCaaS Specialist | PBX/SIP trunk sizing, endpoint selection, ISDN-to-SIP migrations |
| `SECURITY_EXPERT` | Cybersecurity Specialist | Firewall sizing, UTM/IPS licensing, captive portal & compliance reviews |
| `OPERATIONS_PROVISIONING`| Provisioning / Operations | Validated BOM review, readiness checks, deployment handoff |
| `AUDITOR_COMPLIANCE` | Auditor / Compliance Officer | Read-only access to immutable audit trails, export logs, security events |

---

### 2. Comprehensive Resource Permission Matrix

| Resource | Action | Super Admin | Platform Admin | Commercial Agent | Commercial Manager | Domain Expert | Security Expert | Auditor |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Customers & Sites** | VIEW | ✅ | ✅ | ✅ (Assigned) | ✅ (Team) | ✅ (Assigned) | ✅ (Assigned) | ✅ |
| | CREATE / UPDATE | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| | DELETE | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Solution Cases** | VIEW | ✅ | ✅ | ✅ (Own/Assigned) | ✅ (Team) | ✅ (Escalated) | ✅ (Escalated) | ✅ |
| | CREATE | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| | STATE TRANSITION | ✅ | ✅ | ✅ (Workflow) | ✅ | ✅ (Review) | ✅ (Review) | ❌ |
| **Questionnaire** | VIEW / EDIT | ✅ | ✅ | ✅ | ✅ | ✅ (Review) | ✅ (Review) | ❌ |
| **Qualification Engine**| RUN / VIEW | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | CONFIGURE RULES | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Expert Requests** | CREATE / SUBMIT | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| | ACCEPT / RESPOND | ✅ | ❌ | ❌ | ❌ | ✅ (Domain) | ✅ (Security) | ❌ |
| | VIEW CONFIDENTIAL | ✅ | ❌ | ❌ (Masked) | ❌ (Masked) | ✅ (Domain) | ✅ (Security) | ✅ |
| **Product Catalog** | VIEW | ✅ | ✅ | ✅ (Active) | ✅ (Active) | ✅ | ✅ | ✅ |
| | MANAGE / EDIT | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Bill of Materials** | VIEW | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | MODIFY / GENERATE| ✅ | ✅ | ❌ (Draft only) | ✅ | ✅ (Domain) | ✅ (Domain) | ❌ |
| **Commercial Offers** | VIEW / PREPARE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | APPROVE / SIGN | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Documents** | UPLOAD / DOWNLOAD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | REVIEW EXTRACTION | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Audit Logs** | VIEW | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| | PURGE / MUTATE | ❌ (Immutable) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 3. Field-Level Classification & Masking Rules

1. **Security-Sensitive Notes**: `expertReview.internalNotes` is automatically stripped by the API serialization layer unless the requesting user possesses `permission: expert_notes:view_confidential`.
2. **Customer Contract & Margin Data**: Commercial financial margins are masked from technical domain specialists unless dual-roled.
3. **Audit Immutability**: No role (including `SUPER_ADMIN`) can alter or delete rows in the `AuditLog` table.
