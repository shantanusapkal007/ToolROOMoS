// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { DocumentRegistryEngine } from './document-registry.engine';
import { EventBus } from '../event.bus';
import { DocumentLinkEngine } from './document-link.engine';

@Injectable()
export class RevisionEngine {
  constructor(
    private readonly registry: DocumentRegistryEngine,
    private readonly linkEngine: DocumentLinkEngine,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Instructs the specific module to clone the document and bump its version.
   * Revision Engine enforces the rules but relies on the business module to do the actual duplication.
   */
  async requestRevision(documentType: string, entityId: string, reason: string): Promise<void> {
    const doc = await this.registry.getDocumentInfo(documentType, entityId);
    
    if (doc.status !== 'APPROVED' && doc.status !== 'ISSUED') {
      throw new BadRequestException(`Only Approved or Issued documents can be revised. Current status: ${doc.status}`);
    }

    // Publish event for the business module to handle the actual deep copy
    this.eventBus.emit(`${documentType}.RevisionRequested`, {
      sourceEntityId: entityId,
      currentRevision: doc.revision,
      reason
    });
  }
  
  /**
   * Called by the business module after deep copying to establish the SUPERSEDED_BY link.
   */
  async finalizeRevision(documentType: string, oldEntityId: string, newEntityId: string) {
    // Link Old -> New
    await this.linkEngine.linkDocuments(documentType, oldEntityId, documentType, newEntityId, 'SUPERSEDED_BY');
    // Deprecate Old
    await this.registry.updateDocumentState(documentType, oldEntityId, 'REVISED');
  }
}

