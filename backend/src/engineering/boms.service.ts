import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { DocumentStatus, ProjectStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class BomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBom(projectId: string, dto: CreateBomDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch project to ensure existence
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });

      // Only allow BOM creation if project is in ENGINEERING stage
      if (project.currentStage !== ProjectStatus.ENGINEERING) {
        throw new BadRequestException('BOM can only be created during the Engineering stage.');
      }

      // Check for any active BOM revision
      const existingBoms = await tx.billOfMaterialHeader.count({ where: { projectId } });
      const revision = existingBoms + 1;

      // Mark old BOMs as obsolete
      if (existingBoms > 0) {
        await tx.billOfMaterialHeader.updateMany({
          where: { projectId },
          data: { status: DocumentStatus.OBSOLETE },
        });
      }

      // 2. Calculate estimated cost summation
      let totalCost = 0;
      for (const item of dto.items) {
        const estCost = item.estimatedCost || 0;
        totalCost += estCost;
      }

      // 3. Create BOM Header
      const bomHeader = await tx.billOfMaterialHeader.create({
        data: {
          projectId,
          revision,
          documentNumber: dto.documentNumber || `BOM-${project.projectNumber}-${revision}`,
          status: DocumentStatus.DRAFT,
          approvalStatus: ApprovalStatus.PENDING,
          totalEstimatedCost: totalCost,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 4. Create BOM Items
      await Promise.all(
        dto.items.map((item) =>
          tx.billOfMaterialItem.create({
            data: {
              bomHeaderId: bomHeader.id,
              materialId: item.materialId,
              rawSize: item.rawSize,
              calculatedWeight: item.calculatedWeight,
              requiredQty: item.requiredQty,
              estimatedCost: item.estimatedCost || 0,
              remarks: item.remarks,
              createdBy: userId,
              updatedBy: userId,
            },
          })
        )
      );

      // 5. Record activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'BOM_CREATED',
          description: `BOM Rev ${revision} submitted with ${dto.items.length} items. Est Cost: $${totalCost}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return bomHeader;
    });
  }

  async approveBom(projectId: string, bomId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch project and BOM
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      const bom = await tx.billOfMaterialHeader.findFirstOrThrow({
        where: { id: bomId, projectId },
        include: { items: true },
      });

      if (bom.approvalStatus === ApprovalStatus.APPROVED) {
        throw new BadRequestException('BOM is already approved.');
      }

      // 2. Approve the BOM
      const approvedBom = await tx.billOfMaterialHeader.update({
        where: { id: bomId },
        data: {
          approvalStatus: ApprovalStatus.APPROVED,
          status: DocumentStatus.APPROVED,
          updatedBy: userId,
        },
      });

      // 3. Financial Integration: Feed the BOM totalEstimatedCost directly into ProjectCostSummary
      await tx.projectCostSummary.update({
        where: { projectId },
        data: {
          estimatedMaterialCost: bom.totalEstimatedCost,
          totalCost: { increment: bom.totalEstimatedCost }, // Set baseline cost
        },
      });

      // Also record the Estimated Cost event in project_cost_events for detailed auditing
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'ESTIMATED_MATERIAL',
          description: `Base material estimate defined by BOM Rev ${bom.revision} Approval`,
          amount: bom.totalEstimatedCost,
          referenceDocType: 'BOM',
          referenceDocId: bom.id,
          createdBy: userId,
        },
      });

      // 4. Workflow Integration: Advance project to PROCUREMENT stage
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: ProjectStatus.PROCUREMENT, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: ProjectStatus.ENGINEERING,
          toStage: ProjectStatus.PROCUREMENT,
          transitionedBy: userId || 'SYSTEM',
          remarks: `BOM Approved. Target material cost baseline set to $${bom.totalEstimatedCost}`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'BOM_APPROVED',
          description: `BOM Approved by Engineering. Project transitioned to PROCUREMENT.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 5. Automation: Auto-Generate Draft PO for required materials
      try {
        let defaultVendor = await tx.vendor.findFirst({ where: { vendorType: 'MATERIAL_SUPPLIER' } });
        if (!defaultVendor) {
          defaultVendor = await tx.vendor.findFirst();
        }

        if (defaultVendor && bom.items.length > 0) {
          // Check stock vs required for each item (assuming requiredQty needs to be ordered fully for toolroom project)
          const itemsToOrder = bom.items.filter(item => Number(item.requiredQty) > 0);

          if (itemsToOrder.length > 0) {
            const poTotal = itemsToOrder.reduce((sum, item) => sum + Number(item.estimatedCost), 0);
            
            const poHeader = await tx.purchaseOrderHeader.create({
              data: {
                projectId,
                vendorId: defaultVendor.id,
                poNumber: `PO-AUTO-${project.projectNumber}-${Date.now().toString().slice(-4)}`,
                status: 'DRAFT',
                totalAmount: poTotal,
                createdBy: 'SYSTEM',
                remarks: 'Auto-generated from Approved BOM'
              }
            });

            await Promise.all(itemsToOrder.map(item => 
              tx.purchaseOrderItem.create({
                data: {
                  poHeaderId: poHeader.id,
                  materialId: item.materialId,
                  orderedQty: item.requiredQty,
                  agreedRate: Number(item.estimatedCost) / Number(item.requiredQty),
                  lineTotal: item.estimatedCost,
                  remarks: 'Auto-generated item'
                }
              })
            ));

            await tx.projectActivity.create({
              data: {
                projectId,
                action: 'PO_AUTO_GENERATED',
                description: `Draft PO ${poHeader.poNumber} auto-generated for ${itemsToOrder.length} BOM items.`,
                performedBy: 'SYSTEM',
              },
            });
          }
        }
      } catch (err) {
        console.error("Auto PO Generation Failed", err);
      }

      return approvedBom;
    });
  }

  async getBom(projectId: string) {
    return this.prisma.billOfMaterialHeader.findFirst({
      where: { projectId, status: { not: DocumentStatus.OBSOLETE } },
      include: { items: { include: { material: true } } },
    });
  }
}
