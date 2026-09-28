# Versioning, Release Policy & SemVer Standards
## TelcoQualify Release Governance

---

### 1. Semantic Versioning (SemVer 2.0.0)

Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (`1.0.0` -> `2.0.0`): Breaking database schema changes without backwards compatibility, incompatible API contract modifications, major architectural shifts.
- **MINOR** (`1.0.0` -> `1.1.0`): Backward-compatible new domain qualifications (e.g. adding 5G Fixed Wireless Access rules), new questionnaire templates, new export formats.
- **PATCH** (`1.0.0` -> `1.0.1`): Security patches, bug fixes, UI adjustments, translation corrections.

---

### 2. Historical Case Immutability
A core principle of the platform:
> **"A case created under catalog version X must not suddenly change history because product catalog version Y was introduced."**

When a Solution Case is created, it snapshots the current `catalogVersionId` and `questionnaireTemplateVersion`. All subsequent views and qualifications for that case honor the original version baseline unless an authorized user explicitly triggers a `RE-EVALUATE AGAINST CURRENT CATALOG` migration with audit logging.
