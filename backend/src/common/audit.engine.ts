// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AuditEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService
  ) {}

  async logAction(
    entityId: string,
    entityType: string,
    action: string,
    performedByOrSnapshot?: any,
    snapshot?: any,
    oldSnapshot?: any,
  ) {
    let performedBy = this.cls.get('userId') || 'SYSTEM';
    let finalSnapshot = snapshot;

    if (typeof performedByOrSnapshot === 'string') {
      performedBy = performedByOrSnapshot || performedBy;
    } else if (performedByOrSnapshot !== undefined) {
      finalSnapshot = performedByOrSnapshot;
    }

    let payloadToSave = finalSnapshot;

    if (action === 'UPDATE' && oldSnapshot && finalSnapshot) {
      payloadToSave = { changes: this.diffObjects(oldSnapshot, finalSnapshot) };
    }

    try {
      if (this.prisma['auditLog']) {
        await (this.prisma as any).auditLog.create({
          data: {
            entityId,
            entityType,
            action,
            performedBy,
            snapshot: payloadToSave ? payloadToSave : null,
          },
        });
      } else {
        console.warn('[AuditEngine] Missing AuditLog model. Skipped logging: ' + action + ' on ' + entityType + ' ' + entityId);
      }
    } catch (e) {
      console.error('Failed to log action', e);
    }
  }

  private diffObjects(oldObj: any, newObj: any): any[] {
    const changes: any[] = [];
    if (!oldObj || !newObj) return changes;

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      if (oldVal !== newVal) {
        if (typeof oldVal !== 'object' && typeof newVal !== 'object') {
          changes.push({ field: key, old: oldVal, new: newVal });
        } else if (oldVal instanceof Date || newVal instanceof Date) {
          const oldTime = oldVal ? new Date(oldVal).getTime() : null;
          const newTime = newVal ? new Date(newVal).getTime() : null;
          if (oldTime !== newTime) {
            changes.push({ field: key, old: oldVal, new: newVal });
          }
        }
      }
    }

    return changes;
  }
}

