import { Injectable, BadRequestException } from '@nestjs/common';
import { EventBus } from '../event.bus';

// Hardcoded state graphs representing DOCUMENT_STATE_MACHINES.md
const STATE_GRAPHS: Record<string, Record<string, string[]>> = {
  PURCHASE_ORDER: {
    'DRAFT': ['PENDING_APPROVAL', 'CANCELLED'],
    'PENDING_APPROVAL': ['APPROVED', 'DRAFT', 'CANCELLED'],
    'APPROVED': ['ISSUED', 'CANCELLED'],
    'ISSUED': ['PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'],
    'PARTIALLY_RECEIVED': ['COMPLETED'],
    'COMPLETED': ['ARCHIVED'],
    'CANCELLED': ['ARCHIVED'],
  },
  BOM: {
    'DRAFT': ['IN_REVIEW', 'OBSOLETE'],
    'IN_REVIEW': ['APPROVED', 'DRAFT', 'OBSOLETE'],
    'APPROVED': ['REVISED', 'OBSOLETE'],
    'REVISED': ['OBSOLETE'],
  },
  GRN: {
    'DRAFT': ['PENDING_INSPECTION', 'REJECTED'],
    'PENDING_INSPECTION': ['ACCEPTED', 'REJECTED'],
    'ACCEPTED': ['PUTAWAY_COMPLETE'],
  },
  JOB_CARD: {
    'GENERATED': ['RELEASED'],
    'RELEASED': ['STARTED', 'PAUSED', 'CANCELLED'],
    'STARTED': ['PAUSED', 'COMPLETED'],
    'PAUSED': ['STARTED', 'CANCELLED'],
  },
  MATERIAL_ISSUE: {
    'REQUESTED': ['ALLOCATED', 'CANCELLED'],
    'ALLOCATED': ['ISSUED', 'CANCELLED'],
    'ISSUED': ['RETURNED'],
  },
  INVOICE: {
    'PROFORMA': ['GENERATED', 'CANCELLED'],
    'GENERATED': ['SENT', 'CANCELLED'],
    'SENT': ['PARTIALLY_PAID', 'PAID'],
    'PARTIALLY_PAID': ['PAID'],
  }
};

@Injectable()
export class StateMachineEngine {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Validates if a transition is legal. Throws an exception if not.
   */
  validateTransition(documentType: string, currentState: string, targetState: string): void {
    const graph = STATE_GRAPHS[documentType];
    if (!graph) {
      throw new BadRequestException(`No state machine defined for document type: ${documentType}`);
    }

    const allowedNextStates = graph[currentState];
    if (!allowedNextStates) {
      throw new BadRequestException(`State '${currentState}' is not a recognized state for ${documentType}`);
    }

    if (!allowedNextStates.includes(targetState)) {
      throw new BadRequestException(`Illegal state transition for ${documentType}: ${currentState} -> ${targetState}. Allowed next states: ${allowedNextStates.join(', ')}`);
    }
  }

  /**
   * Helper to execute a transition, emit an event, and return the new state.
   */
  transition(documentType: string, entityId: string, currentState: string, targetState: string, payload?: any): string {
    this.validateTransition(documentType, currentState, targetState);
    
    // In the future, this could hook into Prisma directly to update the status, 
    // but typically the business service will call this first, then execute its Prisma transaction.
    
    this.eventBus.emit(`${documentType}.StateChanged`, {
      entityId,
      oldState: currentState,
      newState: targetState,
      timestamp: new Date(),
      ...payload
    });

    return targetState;
  }
}
