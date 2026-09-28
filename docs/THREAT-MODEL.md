# Threat Model & Security Baseline (OWASP ASVS 5.x)
## TelcoQualify Enterprise Security Engineering

---

### 1. Threat Modeling Overview (STRIDE Methodology)

| STRIDE Category | Potential Vector in Telco Presales System | Enterprise Mitigation in TelcoQualify |
|---|---|---|
| **Spoofing** | Forged commercial rep identity, token replay | Strong cryptographic JWT signing, short expiration (8h), secure HTTP-only cookies, strict token structure validation. |
| **Tampering** | Modification of qualification results, manipulation of BOM pricing/quantities | Backend-authoritative calculation; all qualification and BOM computations run on server. Immutable audit trail on all state mutations. |
| **Repudiation** | Denying approval of high-risk security deployment | Cryptographically tagged audit log recording actor, IP, timestamp, previousState, newState, correlationId. |
| **Information Disclosure** | Commercial rep accessing internal firewall vulnerabilities or expert-only security notes | Classification-based Field-Level Security (FLS), automated serialization stripping of `SECURITY_SENSITIVE` fields, strict CORS & CSP headers. |
| **Denial of Service** | Flood uploads of corrupted PDFs or massive qualification requests | Strict file size enforcement (25MB max), magic-byte MIME validation, rate limiting per IP/user, pagination limits (max 50 records/page). |
| **Elevation of Privilege** | Commercial rep invoking `/api/admin/rules` or changing case status to `APPROVED` | RBAC authorization middleware executed on every single API endpoint; client-side UI flags are purely ergonomic. |

---

### 2. Document Intake & Malware Protection

When customers upload documents (specifications, RFP sheets, network diagrams):
1. **Filename Sanitization**: Strip dangerous path characters (`../`, null bytes, control characters).
2. **MIME-Type & Magic Byte Verification**: Check binary signatures rather than relying on user-provided extensions.
3. **Storage Isolation**: Uploads stored in dedicated, private, non-executable directory structure.
4. **Human-in-the-Loop Validation**: Automated extraction results are marked as `DRAFT_PENDING_VERIFICATION` and **never** overwrite trusted structured data without explicit human approval.
