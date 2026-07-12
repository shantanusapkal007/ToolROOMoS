// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AuditService — Universal Version History & Audit Trail
 * 
 * Tracks every change to every document in the system.
 * Supports: field-level change tracking, full snapshot restore, version history.
 * Nothing is ever deleted — only versioned.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a change to any entity
   */
  async recordChange(params: {
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    changes?: Array<{ fieldName: string; oldValue: any; newValue: any }>;
    snapshot?: any;
    reason?: string;
    performedBy?: string;
  }, txClient?: any) {
    const tx = txClient || this.prisma;

    // Get current version number
    const lastEntry = await tx.auditLog.findFirst({
      where: { entityType: params.entityType, entityId: params.entityId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastEntry?.version || 0) + 1;

    if (params.changes && params.changes.length > 0) {
      // Record each field change separately for granular history
      await Promise.all(
        params.changes.map((change) =>
          tx.auditLog.create({
            data: {
              entityType: params.entityType,
              entityId: params.entityId,
              version: nextVersion,
              action: params.action,
              fieldName: change.fieldName,
              oldValue: change.oldValue != null ? String(change.oldValue) : null,
              newValue: change.newValue != null ? String(change.newValue) : null,
              reason: params.reason,
              performedBy: params.performedBy,
              snapshot: params.snapshot,
            },
          })
        )
      );
    } else {
      // Record a single entry (e.g., CREATE or DELETE)
      await tx.auditLog.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          version: nextVersion,
          action: params.action,
          reason: params.reason,
          performedBy: params.performedBy,
          snapshot: params.snapshot,
        },
      });
    }
  }

  /**
   * Get full version history for any entity
   */
  async getHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { performedAt: 'desc' },
    });
  }

  /**
   * Get a specific version's snapshot for restore
   */
  async getVersion(entityType: string, entityId: string, version: number) {
    return this.prisma.auditLog.findFirst({
      // @ts-ignore
      where: { entityType, entityId, version, snapshot: { not: null } },
    });
  }

  /**
   * Compute diff between old and new objects for tracking changes
   */
  computeChanges(oldObj: Record<string, any>, newObj: Record<string, any>): Array<{ fieldName: string; oldValue: any; newValue: any }> {
    const changes: Array<{ fieldName: string; oldValue: any; newValue: any }> = [];
    const skipFields = ['updatedAt', 'updatedBy', 'createdAt', 'createdBy', 'id'];

    for (const key of Object.keys(newObj)) {
      if (skipFields.includes(key)) continue;
      const oldVal = oldObj[key];
      const newVal = newObj[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ fieldName: key, oldValue: oldVal, newValue: newVal });
      }
    }
    return changes;
  }
}

