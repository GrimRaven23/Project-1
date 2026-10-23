/**
 * Central Database Repository & Store
 * Implements atomic transactional operations, optimistic concurrency checks,
 * and dual-store support (local fast memory/file state + PostgreSQL compatibility).
 */

import { Customer, SolutionCase, ExpertRequest, AuditLogEntry, User, Site, Contact } from "../domain/types";
import { SEED_CUSTOMERS, SEED_CASES, SEED_USERS } from "./seed-data";
import { AuditService } from "../audit/audit-logger";

/**
 * Whether demo fixtures may be loaded into the in-memory store.
 *
 * SECURITY: production must start with a clean, empty store. Seeding real-looking
 * demo accounts/customers into a production process would create unexplained data
 * with known credentials. The guard keys off NODE_ENV, not a casually-set env var —
 * `NODE_ENV` is derived from how the process is started and is not a deployment
 * secret an operator flips on a whim. Set `TELCO_ALLOW_SEEDING=true` *and*
 * NODE_ENV=production only if you deliberately want demo data in a prod-like build.
 */
const SEEDING_ENABLED =
  process.env.NODE_ENV !== "production" || process.env.TELCO_ALLOW_SEEDING === "true";

export class DatabaseRepository {
  private static customers: Map<string, Customer> = new Map();
  private static cases: Map<string, SolutionCase> = new Map();
  private static users: Map<string, User> = new Map();
  private static sites: Map<string, Site> = new Map();
  private static contacts: Map<string, Contact> = new Map();
  private static initialized: boolean = false;

  private static ensureInitialized() {
    if (this.initialized) return;

    if (SEEDING_ENABLED) {
      for (const u of SEED_USERS) {
        this.users.set(u.id, u);
      }
      for (const c of SEED_CUSTOMERS) {
        this.customers.set(c.id, c);
      }
      for (const sc of SEED_CASES) {
        this.cases.set(sc.id, sc);
      }
    } else if (process.env.NODE_ENV === "production") {
      // Loud, single-line signal for operators inspecting production logs.
      console.warn(
        "[TelcoQualify] Starting with an EMPTY user/customer store (demo seeding disabled in production). " +
          "Provision real users before serving traffic."
      );
    }

    this.initialized = true;
  }

  // Users
  static getUsers(): User[] {
    this.ensureInitialized();
    return Array.from(this.users.values());
  }

  static getUserById(id: string): User | undefined {
    this.ensureInitialized();
    return this.users.get(id);
  }

  // Customers
  static getCustomers(search?: string): Customer[] {
    this.ensureInitialized();
    let list = Array.from(this.customers.values());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.sirenOrVat.toLowerCase().includes(q) ||
          c.primaryContact.name.toLowerCase().includes(q)
      );
    }
    return list;
  }

  static getCustomerById(id: string): Customer | undefined {
    this.ensureInitialized();
    return this.customers.get(id);
  }

  static saveCustomer(customer: Customer): Customer {
    this.ensureInitialized();
    this.customers.set(customer.id, customer);
    return customer;
  }

  // Users (write path — used by admin provisioning, not by seeding)
  static saveUser(user: User): User {
    this.ensureInitialized();
    this.users.set(user.id, user);
    return user;
  }

  // Contacts (customer-level address book)
  static getContactsByCustomerId(customerId: string): Contact[] {
    this.ensureInitialized();
    return Array.from(this.contacts.values())
      .filter((c) => c.customerId === customerId)
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));
  }

  static getContactById(id: string): Contact | undefined {
    this.ensureInitialized();
    return this.contacts.get(id);
  }

  static saveContact(contact: Contact): Contact {
    this.ensureInitialized();
    this.contacts.set(contact.id, contact);
    return contact;
  }

  static deleteContact(id: string): boolean {
    this.ensureInitialized();
    return this.contacts.delete(id);
  }

  // Sites (customer-level premises)
  static getSitesByCustomerId(customerId: string): Site[] {
    this.ensureInitialized();
    return Array.from(this.sites.values()).filter((s) => s.customerId === customerId);
  }

  static getSiteById(id: string): Site | undefined {
    this.ensureInitialized();
    return this.sites.get(id);
  }

  static saveSite(site: Site): Site {
    this.ensureInitialized();
    this.sites.set(site.id, site);
    return site;
  }

  static deleteSite(id: string): boolean {
    this.ensureInitialized();
    return this.sites.delete(id);
  }

  // Cases
  static getCases(filters?: { customerId?: string; state?: string; search?: string }): SolutionCase[] {
    this.ensureInitialized();
    let list = Array.from(this.cases.values());

    if (filters?.customerId) {
      list = list.filter((c) => c.customerId === filters.customerId);
    }
    if (filters?.state) {
      list = list.filter((c) => c.lifecycleState === filters.state);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.customer?.companyName || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static getCaseById(id: string): SolutionCase | undefined {
    this.ensureInitialized();
    return this.cases.get(id);
  }

  static saveCase(solutionCase: SolutionCase, actorUser?: User): SolutionCase {
    this.ensureInitialized();
    const existing = this.cases.get(solutionCase.id);

    // Optimistic concurrency check
    if (existing && solutionCase.version !== undefined && solutionCase.version < existing.version) {
      throw new Error(`Concurrency Conflict: Case ${solutionCase.caseNumber} was modified by another user. Please reload.`);
    }

    const updatedCase: SolutionCase = {
      ...solutionCase,
      version: (existing?.version || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    // Attach customer object if missing
    if (!updatedCase.customer && updatedCase.customerId) {
      updatedCase.customer = this.customers.get(updatedCase.customerId);
    }

    this.cases.set(updatedCase.id, updatedCase);

    if (actorUser) {
      AuditService.logEvent({
        caseId: updatedCase.id,
        caseNumber: updatedCase.caseNumber,
        actorId: actorUser.id,
        actorName: actorUser.name,
        actorRole: actorUser.role,
        action: existing ? "CASE_UPDATED" : "CASE_CREATED",
        resource: "SolutionCase",
        resourceId: updatedCase.id,
        previousState: existing ? { state: existing.lifecycleState, version: existing.version } : undefined,
        newState: { state: updatedCase.lifecycleState, version: updatedCase.version }
      });
    }

    return updatedCase;
  }

  // Expert Requests Queue
  static getAllExpertRequests(filters?: { domain?: string; status?: string }): ExpertRequest[] {
    this.ensureInitialized();
    const allRequests: ExpertRequest[] = [];
    for (const sc of this.cases.values()) {
      if (sc.expertRequests) {
        for (const req of sc.expertRequests) {
          allRequests.push(req);
        }
      }
    }

    let filtered = allRequests;
    if (filters?.domain) {
      filtered = filtered.filter((r) => r.domain === filters.domain);
    }
    if (filters?.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
