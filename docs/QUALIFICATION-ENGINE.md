# Qualification Engine & Business Rule Specification
## Deterministic, Explainable Multi-Domain Solution Sizing

---

### 1. Philosophy & Non-Negotiable Rule

> **"Never invent telecom capabilities, product availability, pricing, hardware compatibility, firewall sizing, licensing rules, or network-engineering decisions merely because the system lacks information."**

Every automated recommendation emitted by TelcoQualify must be backed by:
1. **Registered Catalog Rule**: Linked by Rule ID (e.g. `RULE-WAN-FTTH-BANDWIDTH-01`).
2. **Transparent Explanation Text**: Human-readable rationale shown in both French and English.
3. **Deterministic State**: Either fully satisfied, missing specific parameter, or flagged for mandatory Expert Review.

---

### 2. Multi-Domain Qualification Rules

#### Domain 1: Telephony & UCaaS
- **Rule `TEL-SIP-01` (ISDN Migration)**: If customer has existing legacy T0/T2 ISDN connectivity and requests new telephone endpoints $\ge 4$, trigger recommendation for **Cloud PBX + SIP Trunk** migration with PBX Gateway retirement.
- **Rule `TEL-EP-01` (Endpoint Sizing)**: If endpoint count $\ge 1$, compute breakdown across Executive (Touchscreen/Gigabit), Standard (IP Phone), Receptionist (Expansion Module Console), and Softphone licenses.
- **Rule `TEL-ROUTING-01` (SLA & QoS)**: If voice endpoints $\ge 20$ on a single site, mark Voice QoS VLAN / Dedicated Voice PVC requirement as **MANDATORY**.

#### Domain 2: Internet, WAN & Fiber
- **Rule `WAN-FIBER-01` (Symmetrical Bandwidth)**: If customer requirement specifies cloud backup, hosted PBX $>15$ channels, or $>30$ users, qualify for **Dedicated FTTO (Fiber to the Office)** with Guaranteed Symmetrical Bandwidth and 4-hour GTR (Guaranteed Time to Repair) rather than shared FTTH.
- **Rule `WAN-BACKUP-01` (High Availability)**: If customer marks business criticality as `HIGH` or `CRITICAL`, trigger mandatory **4G/5G Cellular Backup Router** or secondary diversified fiber link.

#### Domain 3: LAN & Wi-Fi Coverage
- **Rule `WIFI-DENSITY-01` (Area-Based AP Sizing)**:
  - *Small office spaces ($\le 40\text{ m}^2$)*: $1$ AP per $80\text{ m}^2$.
  - *Corridors / Circulation*: $1$ AP per $25\text{ m}$ linear.
  - *Meeting rooms ($\ge 12\text{ seats}$)*: $1$ High-Density Wi-Fi 6 AP per room.
  - *Open Spaces / Large Office Areas ($\ge 150\text{ m}^2$)*: $1$ AP per $100\text{ m}^2$ or 25 concurrent active devices.
- **Rule `WIFI-GUEST-01` (Captive Portal & Code-Based Access)**: If customer requests guest access or code-based authentication, add Cloud Wi-Fi Controller + SMS/Voucher Authentication License to BOM.

#### Domain 4: Cybersecurity & Firewalls
- **Rule `SEC-FW-RENEW-01` (Firewall License Expiry)**: If existing firewall age $\ge 3$ years or license status is `EXPIRED` / `EXPIRING_SOON`, recommend **UTM Renewal Bundle** or **Next-Gen Hardware Refresh** (e.g. FortiGate 60F/70F or Cisco Firepower).
- **Rule `SEC-SSL-INSPECT-01` (Throughput Sizing)**: If customer has $>50$ users and requires Deep Packet SSL Inspection + Antivirus, standard entry-level firewalls fail qualification; escalate to **Security Expert** for customized throughput sizing.
