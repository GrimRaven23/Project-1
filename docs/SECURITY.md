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
1. **Detection**: Alert triggered via Prometheus / Sentry / Audit log anomaly.
2. **Containment**: Revoke compromised sessions via Redis/JWT blacklist; lock affected tenant/user account.
3. **Remediation**: Develop fix in isolated `security/*` branch, verify with automated SAST/DAST.
4. **Disclosure**: Publish CVE advisory and notify affected enterprise customers within 24 hours.

---

### 3. Reporting a Vulnerability
Send security reports to `security@telcoqualify.internal` with detailed reproduction steps and impact analysis.
