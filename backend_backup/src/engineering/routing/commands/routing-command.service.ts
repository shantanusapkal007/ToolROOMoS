import { Injectable } from '@nestjs/common';
import { RoutingRepository } from '../repositories/routing.repository';
import { RoutingValidationService } from '../validators/routing-validation.service';
import { EventBus } from '../../../platform/event.bus';
import { AuditEngine } from '../../../platform/audit.engine';
import { RoutingCreated, RoutingUpdated, RoutingApproved } from '../events/routing.events';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RoutingCommandService {
  constructor(
    private readonly repository: RoutingRepository,
    private readonly validator: RoutingValidationService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
    private readonly cls: ClsService
  ) {}

  async createRouting(projectId: string, dto: any) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const header = await this.repository.createHeader({
      ...dto,
      projectId,
      status: 'DRAFT',
      approvalStatus: 'PENDING',
      createdBy: userId,
      updatedBy: userId,
    });

    await this.audit.logAction(header.id, 'ROUTING', 'CREATE', header);
    this.eventBus.emit('RoutingCreated', new RoutingCreated(header.id, projectId));

    return header;
  }

  async addOperations(routingHeaderId: string, operations: any[]) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    await this.validator.validateRevision(routingHeaderId);
    await this.validator.validateNewOperations(routingHeaderId, operations);

    const oldRouting = await this.repository.findHeaderById(routingHeaderId, { operations: true });

    const newOps = operations.map(op => ({
      routingHeaderId,
      ...op,
    }));

    await this.repository.createOperationsBulk(newOps);
    
    const newRouting = await this.repository.findHeaderById(routingHeaderId, { operations: true });

    await this.audit.logAction(routingHeaderId, 'ROUTING', 'UPDATE', userId, newRouting, oldRouting);
    this.eventBus.emit('RoutingUpdated', new RoutingUpdated(routingHeaderId));

    return newRouting;
  }

  async approveRouting(routingHeaderId: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';
    
    const routing = await this.repository.updateHeader({ id: routingHeaderId }, {
      approvalStatus: 'APPROVED',
      status: 'FROZEN',
      updatedBy: userId
    });

    await this.audit.logAction(routingHeaderId, 'ROUTING', 'APPROVE', routing);
    this.eventBus.emit('RoutingApproved', new RoutingApproved(routingHeaderId, routing.projectId));

    return routing;
  }
}
