// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PlanningRepository } from '../repositories/planning.repository';
import { DemandService } from '../demand/demand.service';
import { BomExplosionService, GrossRequirement } from '../explosion/bom-explosion.service';
import { InventoryNettingService, NetRequirement } from '../netting/inventory-netting.service';
import { ExceptionService, ExceptionDraft } from '../exceptions/exception.service';
import { RecommendationService, RecommendationDraft } from '../recommendations/recommendation.service';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';
import { PlanningRunStarted, PlanningRunCompleted } from '../events/planning.events';

@Injectable()
export class PlanningEngine {
  constructor(
    private readonly repository: PlanningRepository,
    private readonly demandService: DemandService,
    private readonly explosionService: BomExplosionService,
    private readonly nettingService: InventoryNettingService,
    private readonly exceptionService: ExceptionService,
    private readonly recommendationService: RecommendationService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine
  ) {}

  async runPlanningPipeline(projectId: string, runBy: string = 'SYSTEM') {
    // 0. PlanningRunStarted Event
    this.eventBus.emit(new PlanningRunStarted(projectId));

    // 1. Create Immutable Planning Run Snapshot
    const run = await this.repository.createPlanningRun({
      projectId,
      runBy,
      status: 'IN_PROGRESS'
    });

    try {
      // 2. Demand Extraction
      const boms = await this.demandService.extractDemandForProject(projectId);
      if (boms.length === 0) {
        await this.repository.updateRun({ id: run.id }, { status: 'COMPLETED', remarks: 'No approved demand found' });
        return run;
      }

      // 3. Recursive Multi-Level BOM Explosion
      let allGrossReqs: GrossRequirement[] = [];
      for (const bom of boms) {
        const reqs = await this.explosionService.explodeBom(bom.id);
        allGrossReqs = [...allGrossReqs, ...reqs];
      }

      // 4. Inventory Netting
      const netReqs = await this.nettingService.calculateNetRequirements(allGrossReqs);

      // 5. Generate Exceptions
      const exceptionDrafts = this.exceptionService.generateExceptions(netReqs);
      
      // 6. Generate Recommendations
      const recommendationDrafts = this.recommendationService.generateRecommendations(netReqs);

      // 7. Persist Snapshot Results in Transaction
      await this.repository.executeInTransaction(async (tx) => {
        // Save Exceptions
        if (exceptionDrafts.length > 0) {
          await tx.planningException.createMany({
            data: exceptionDrafts.map(e => ({
              planningRunId: run.id,
              materialId: e.materialId,
              exceptionType: e.exceptionType,
              exceptionMessage: e.exceptionMessage,
              severity: e.severity
            }))
          });
        }

        // Save Recommendation Document
        if (recommendationDrafts.length > 0) {
          const recDoc = await tx.planningRecommendation.create({
            data: {
              planningRunId: run.id,
              projectId,
              recommendationNo: `PLN-${Date.now()}`,
              createdBy: runBy,
            }
          });

          await tx.planningRecommendationItem.createMany({
            data: recommendationDrafts.map(r => ({
              recommendationId: recDoc.id,
              materialId: r.materialId,
              requiredQuantity: r.requiredQuantity,
              source: r.source
            }))
          });
        }

        // Mark Run Complete
        await tx.planningRun.update({
          where: { id: run.id },
          data: { status: 'COMPLETED' }
        });
      });

      // 8. Audit & Events
      await this.audit.logAction(run.id, 'PLANNING_RUN', 'EXECUTE', runBy, run);
      this.eventBus.emit(new PlanningRunCompleted(run.id, projectId));

      return this.repository.findRunById(run.id, { exceptions: true, recommendations: true });

    } catch (error) {
      // Mark Failed
      await this.repository.updateRun({ id: run.id }, { status: 'FAILED', remarks: error.message });
      throw error;
    }
  }
}

