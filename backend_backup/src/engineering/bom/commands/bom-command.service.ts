import { Injectable } from '@nestjs/common';
import { BomRepository } from '../repositories/bom.repository';
import { BomValidationService } from '../validators/bom-validation.service';
import { EventBus } from '../../../platform/event.bus';
import { AuditEngine } from '../../../platform/audit.engine';
import { BomCreated, BomUpdated, BomApproved } from '../events/bom.events';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class BomCommandService {
  constructor(
    private readonly repository: BomRepository,
    private readonly validator: BomValidationService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
    private readonly cls: ClsService
  ) {}

  async createBom(projectId: string, dto: any) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const header = await this.repository.createHeader({
      ...dto,
      projectId,
      status: 'DRAFT',
      approvalStatus: 'PENDING',
      createdBy: userId,
      updatedBy: userId,
    });

    await this.audit.logAction(header.id, 'BILL_OF_MATERIAL', 'CREATE', header);
    this.eventBus.emit('BomCreated', new BomCreated(header.id, projectId));

    return header;
  }

  async addItems(bomHeaderId: string, items: any[]) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    await this.validator.validateRevision(bomHeaderId);
    await this.validator.validateNewItems(bomHeaderId, items);

    const oldBom = await this.repository.findHeaderById(bomHeaderId, { items: true });

    const newItems = items.map(item => ({
      bomHeaderId,
      ...item,
    }));

    await this.repository.createItemsBulk(newItems);
    
    // We fetch the updated BOM to perform diffing
    const newBom = await this.repository.findHeaderById(bomHeaderId, { items: true });

    await this.audit.logAction(bomHeaderId, 'BILL_OF_MATERIAL', 'UPDATE', userId, newBom, oldBom);
    this.eventBus.emit('BomUpdated', new BomUpdated(bomHeaderId));

    return newBom;
  }

  async approveBom(bomHeaderId: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';
    
    // Additional workflow checks can be done here, e.g., verifying user is authorized
    const bom = await this.repository.updateHeader({ id: bomHeaderId }, {
      approvalStatus: 'APPROVED',
      status: 'FROZEN', // Custom status enforcement
      updatedBy: userId
    });

    await this.audit.logAction(bomHeaderId, 'BILL_OF_MATERIAL', 'APPROVE', bom);
    this.eventBus.emit('BomApproved', new BomApproved(bomHeaderId, bom.projectId));

    return bom;
  }

  // Other mutation methods...
}
