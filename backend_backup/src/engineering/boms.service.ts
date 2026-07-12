// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { DocumentStatus, ApprovalStatus } from '@prisma/client';

/**
 * BomsService — Document-Centric BOM Management
 * 
 * BOMs are independent, editable documents. No stage locking.
 * BOM can be created, edited, approved at any time regardless of project stage.
 */
@Injectable()
export class BomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBom(projectId: string, dto: CreateBomDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch project to ensure existence
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });

      // No stage check — BOM is an independent document, creatable anytime

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

      // 2. Calculate estimated cost summation and fetch standard costs
      const materialIds = dto.items.map(i => i.materialId);
      const materials = await tx.material.findMany({ where: { id: { in: materialIds } } });
      const materialMap = new Map(materials.map(m => [m.id, m]));

      let totalCost = 0;
      for (const item of dto.items) {
        // Calculate estimated cost if not provided but unitCost is
        if (!item.estimatedCost && item.unitCost) {
            const qty = Number(item.requiredQty) || 0;
            const cost = Number(item.unitCost) || 0;
            const scrap = Number(item.scrapPercent) || 0;
            const processCost = Number(item.estimatedProcessCost) || 0;
            
            item.estimatedCost = (qty * cost * (1 + (scrap / 100))) + processCost;
        }

        let estCost = Number(item.estimatedCost || 0);
        
        if (estCost === 0 && item.materialId) {
            const mat = materialMap.get(item.materialId);
            if (mat && mat.standardCost) {
                estCost = Number(mat.standardCost) * Number(item.requiredQty);
                item.estimatedCost = estCost;
            }
        }
        
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
              id: item.id || undefined,
              bomHeaderId: bomHeader.id,
              parentId: item.parentId || null,
              isAssembly: item.isAssembly || false,
              materialId: item.materialId,
              partNo: item.partNo,
              partName: item.partName,
              materialGrade: item.materialGrade,
              unit: item.unit,
              finishSize: item.finishSize,
              rawSize: item.rawSize,
              heatTreatment: item.heatTreatment,
              supplier: item.supplier,
              weight: item.weight,
              calculatedWeight: item.calculatedWeight,
              requiredQty: item.requiredQty,
              unitCost: item.unitCost,
              scrapPercent: item.scrapPercent,
              estimatedProcessCost: item.estimatedProcessCost,
              estimatedCost: item.estimatedCost || 0,
              remarks: item.remarks,
              customFields: item.customFields,
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
          description: `BOM Rev ${revision} submitted with ${dto.items.length} items. Est Cost: ₹${totalCost}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return bomHeader;
    });
  }

  async deleteBom(projectId: string, bomId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const bom = await tx.billOfMaterialHeader.findFirstOrThrow({
        where: { id: bomId, projectId },
      });

      if (bom.approvalStatus === ApprovalStatus.APPROVED) {
        throw new BadRequestException('Cannot delete an approved BOM.');
      }

      await tx.billOfMaterialItem.deleteMany({ where: { bomHeaderId: bomId } });
      await tx.billOfMaterialHeader.delete({ where: { id: bomId } });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'BOM_DELETED',
          description: `BOM Rev ${bom.revision} was deleted.`,
          performedBy: userId || 'SYSTEM',
        },
      });
      return { success: true };
    });
  }

  async duplicateBom(projectId: string, bomId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const originalBom = await tx.billOfMaterialHeader.findFirstOrThrow({
        where: { id: bomId, projectId },
        include: { items: true },
      });

      const existingBoms = await tx.billOfMaterialHeader.count({ where: { projectId } });
      const revision = existingBoms + 1;
      const project = await tx.project.findUnique({ where: { id: projectId } });

      const newBom = await tx.billOfMaterialHeader.create({
        data: {
          projectId,
          revision,
          documentNumber: `BOM-${project?.projectNumber || 'DUP'}-${revision}`,
          status: DocumentStatus.DRAFT,
          approvalStatus: ApprovalStatus.PENDING,
          totalEstimatedCost: originalBom.totalEstimatedCost,
          remarks: `Duplicated from Rev ${originalBom.revision}`,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (originalBom.items.length > 0) {
        await tx.billOfMaterialItem.createMany({
          data: originalBom.items.map(item => ({
            bomHeaderId: newBom.id,
            materialId: item.materialId,
            partNo: item.partNo,
            partName: item.partName,
            finishSize: item.finishSize,
            rawSize: item.rawSize,
            heatTreatment: item.heatTreatment,
            supplier: item.supplier,
            weight: item.weight,
            calculatedWeight: item.calculatedWeight,
            requiredQty: item.requiredQty,
            estimatedCost: item.estimatedCost,
            remarks: item.remarks,
            customFields: item.customFields as any,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'BOM_DUPLICATED',
          description: `BOM Rev ${revision} created as a duplicate of Rev ${originalBom.revision}.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return newBom;
    });
  }

  async updateBom(projectId: string, bomId: string, dto: CreateBomDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const bom = await tx.billOfMaterialHeader.findFirstOrThrow({
        where: { id: bomId, projectId },
        include: { items: true },
      });

      // Delete existing items and recreate
      await tx.billOfMaterialItem.deleteMany({ where: { bomHeaderId: bomId } });

      // Recalculate costs
      const materialIds = dto.items.map(i => i.materialId);
      const materials = await tx.material.findMany({ where: { id: { in: materialIds } } });
      const materialMap = new Map(materials.map(m => [m.id, m]));

      let totalCost = 0;
      for (const item of dto.items) {
        if (!item.estimatedCost && item.unitCost) {
            const qty = Number(item.requiredQty) || 0;
            const cost = Number(item.unitCost) || 0;
            const scrap = Number(item.scrapPercent) || 0;
            const processCost = Number(item.estimatedProcessCost) || 0;
            
            item.estimatedCost = (qty * cost * (1 + (scrap / 100))) + processCost;
        }

        let estCost = Number(item.estimatedCost || 0);
        
        if (estCost === 0 && item.materialId) {
            const mat = materialMap.get(item.materialId);
            if (mat && mat.standardCost) {
                estCost = Number(mat.standardCost) * Number(item.requiredQty);
                item.estimatedCost = estCost;
            }
        }
        
        totalCost += estCost;
      }

      // Create new items
      await Promise.all(
        dto.items.map((item) =>
          tx.billOfMaterialItem.create({
            data: {
              id: item.id || undefined,
              bomHeaderId: bomId,
              parentId: item.parentId || null,
              isAssembly: item.isAssembly || false,
              materialId: item.materialId,
              partNo: item.partNo,
              partName: item.partName,
              materialGrade: item.materialGrade,
              unit: item.unit,
              finishSize: item.finishSize,
              rawSize: item.rawSize,
              heatTreatment: item.heatTreatment,
              supplier: item.supplier,
              weight: item.weight,
              calculatedWeight: item.calculatedWeight,
              requiredQty: item.requiredQty,
              unitCost: item.unitCost,
              scrapPercent: item.scrapPercent,
              estimatedProcessCost: item.estimatedProcessCost,
              estimatedCost: item.estimatedCost || 0,
              remarks: item.remarks,
              customFields: item.customFields,
              createdBy: userId,
              updatedBy: userId,
            },
          })
        )
      );

      // Update header
      const updatedBom = await tx.billOfMaterialHeader.update({
        where: { id: bomId },
        data: {
          totalEstimatedCost: totalCost,
          updatedBy: userId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'BOM_UPDATED',
          description: `BOM Rev ${bom.revision} updated with ${dto.items.length} items. Est Cost: ₹${totalCost}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updatedBom;
    });
  }

  async approveBom(projectId: string, bomId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch project and BOM
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      const bom = await tx.billOfMaterialHeader.findFirstOrThrow({
        where: { id: bomId, projectId },
        include: { items: { include: { material: true } } },
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

      // 3. Financial Integration: Feed the BOM totalEstimatedCost into ProjectCostSummary (ESTIMATED column only)
      // IMPORTANT: totalCost tracks ACTUAL costs only (consumption + machine + labour + dispatch).
      // Estimated cost MUST NOT increment totalCost — doing so double-counts against actual issues.
      await tx.projectCostSummary.upsert({
        where: { projectId },
        create: {
          projectId,
          estimatedMaterialCost: bom.totalEstimatedCost,
          actualMaterialCost: 0,
          materialConsumptionCost: 0,
          machineCost: 0,
          labourCost: 0,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: 0,
          totalCost: 0,
          revenue: 0,
          profitability: 0,
        },
        update: {
          estimatedMaterialCost: bom.totalEstimatedCost,
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

      // No forced stage transition — project stage is computed by the orchestrator

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'BOM_APPROVED',
          description: `BOM Rev ${bom.revision} Approved by Engineering.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 5. Automation: Auto-Generate Draft PO for required materials (non-blocking)
      try {
        // Cleanup previous stale auto-generated POs for this project
        const stalePos = await tx.purchaseOrderHeader.findMany({
          where: { 
            projectId, 
            poNumber: { startsWith: 'PO-AUTO-' },
            status: { in: ['DRAFT', 'ON_HOLD'] }
          },
          select: { id: true }
        });
        
        for (const stale of stalePos) {
          await tx.purchaseOrderItem.deleteMany({ where: { poHeaderId: stale.id } });
          await tx.purchaseOrderHeader.delete({ where: { id: stale.id } });
        }

        let defaultVendor = await tx.vendor.findFirst({ where: { vendorType: 'MATERIAL_SUPPLIER' } });
        if (!defaultVendor) {
          defaultVendor = await tx.vendor.findFirst();
        }

        if (defaultVendor && bom.items.length > 0) {
          const itemsToOrder = bom.items.filter(item => Number(item.requiredQty) > 0);

          if (itemsToOrder.length > 0) {
            let poTotal = 0;
            const itemsWithRates = itemsToOrder.map(item => {
              const reqQty = Number(item.requiredQty);
              const weight = Number(item.calculatedWeight || 0);
              const qtyToOrder = weight > 0 ? weight : reqQty;
              let estCost = Number(item.estimatedCost || 0);
              let rate = 0;
              
              if (estCost === 0 && item.material && Number(item.material.standardCost || 0) > 0) {
                 rate = Number(item.material.standardCost);
                 estCost = rate * qtyToOrder;
              } else if (qtyToOrder > 0) {
                 rate = estCost / qtyToOrder;
              }
              
              poTotal += estCost;
              return { ...item, calculatedRate: rate, finalCost: estCost, qtyToOrder };
            });

            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const poHeader = await tx.purchaseOrderHeader.create({
              data: {
                projectId,
                vendorId: defaultVendor.id,
                poNumber: `PO-AUTO-${project.projectNumber}-${randomSuffix}`,
                status: 'DRAFT',
                totalAmount: poTotal,
                createdBy: 'SYSTEM',
                remarks: 'Auto-generated from Approved BOM'
              }
            });

            await Promise.all(itemsWithRates.map(item => 
              tx.purchaseOrderItem.create({
                data: {
                  poHeaderId: poHeader.id,
                  materialId: item.materialId,
                  orderedQty: item.qtyToOrder,
                  agreedRate: item.calculatedRate,
                  lineTotal: item.finalCost,
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

  async rejectBom(projectId: string, bomId: string, remarks?: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const bom = await tx.billOfMaterialHeader.findFirstOrThrow({ where: { id: bomId, projectId } });

      if (bom.approvalStatus !== ApprovalStatus.PENDING) {
        throw new BadRequestException('Only pending BOMs can be rejected.');
      }

      const rejectedBom = await tx.billOfMaterialHeader.update({
        where: { id: bomId },
        data: {
          approvalStatus: ApprovalStatus.REJECTED,
          status: DocumentStatus.REJECTED,
          remarks: remarks || bom.remarks,
          updatedBy: userId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'BOM_REJECTED',
          description: `BOM Rev ${bom.revision} Rejected. Reason: ${remarks || 'No reason provided'}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return rejectedBom;
    });
  }

  async getBom(projectId: string) {
    return this.prisma.billOfMaterialHeader.findFirst({
      where: { projectId, status: { not: DocumentStatus.OBSOLETE } },
      include: { items: { include: { material: true } } },
    });
  }

  async getAllBoms(projectId: string) {
    return this.prisma.billOfMaterialHeader.findMany({
      where: { projectId },
      include: { items: { include: { material: true } } },
      orderBy: { revision: 'desc' },
    });
  }

  async getGlobalBoms(projectId?: string) {
    return this.prisma.billOfMaterialHeader.findMany({
      where: projectId ? { projectId } : undefined,
      include: { 
        project: {
          select: { projectNumber: true, partName: true }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

