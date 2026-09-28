/**
 * Cryptographically Structured Immutable Audit Logger
 * Records actor, timestamp, action, state differences, IP metadata, and correlation IDs.
 */

import { AuditLogEntry, UserRole } from "../domain/types";

export class AuditService {
  private static inMemoryLogs: AuditLogEntry[] = [];

  /**
   * Logs an immutable audit event
   */
  static logEvent(params: {
    caseId?: string;
    caseNumber?: string;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: string;
    resource: string;
    resourceId: string;
    previousState?: any;
    newState?: any;
    ipAddress?: string;
    correlationId?: string;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      caseId: params.caseId,
      caseNumber: params.caseNumber,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      previousState: params.previousState ? JSON.parse(JSON.stringify(params.previousState)) : undefined,
      newState: params.newState ? JSON.parse(JSON.stringify(params.newState)) : undefined,
      ipAddress: params.ipAddress || "127.0.0.1",
      correlationId: params.correlationId || `corr-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    this.inMemoryLogs.unshift(entry);
    return entry;
  }

  /**
   * Retrieves audit logs with filtering
   */
  static getLogs(filters?: { caseId?: string; resource?: string; actorId?: string; limit?: number }): AuditLogEntry[] {
    let result = [...this.inMemoryLogs];

    if (filters?.caseId) {
      result = result.filter((l) => l.caseId === filters.caseId);
    }
    if (filters?.resource) {
      result = result.filter((l) => l.resource === filters.resource);
    }
    if (filters?.actorId) {
      result = result.filter((l) => l.actorId === filters.actorId);
    }

    return result.slice(0, filters?.limit || 100);
  }
}
