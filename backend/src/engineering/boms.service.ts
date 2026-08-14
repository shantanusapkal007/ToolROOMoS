import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { DocumentStatus, ProjectStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class BomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBom(projectId: string, dto: CreateBomDto, userId?: string) {
    console.log("CreateBOM DTO items:", JSON.stringify(dto.items, null, 2));
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch project to ensure existence (resolving by ID or projectNumber like KTD-433)
      const project = await tx.project.findFirst({
        where: {
          OR: [
            { id: projectId },
            { projectNumber: projectId }
          ]
        }
      });

      if (!project) {
        throw new NotFoundException(`Project not found for ID or project number '${projectId}'.`);
      }

      const targetProjectId = project.id;

      // Stage restriction removed to allow BOM creation at any time

      // Check for any active BOM revision
      const existingBoms = await tx.billOfMaterialHeader.count({ where: { projectId: targetProjectId } });
      const revision = existingBoms + 1;

      // Mark old BOMs as obsolete
      if (existingBoms > 0) {
        await tx.billOfMaterialHeader.updateMany({
          where: { projectId: targetProjectId },
          data: { status: DocumentStatus.OBSOLETE },
        });
      }

      // 2. Fetch materials for estimated cost calculation
      const validMaterialIds = dto.items
        .map(i => i.materialId)
        .filter((id): id is string => Boolean(id));
      const materials = validMaterialIds.length > 0
        ? await tx.material.findMany({ where: { id: { in: validMaterialIds } } })
        : [];
      const materialMap = new Map(materials.map(m => [m.id, m]));

      // Fallback default material if none provided
      const defaultMaterial = await tx.material.findFirst({
        where: { materialCode: 'STD' }
      }) || await tx.material.findFirst();
      const defaultMatId = defaultMaterial?.id || '';

      let totalCost = 0;
      for (const item of dto.items) {
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
          projectId: targetProjectId,
          revision,
          documentNumber: dto.documentNumber || `BOM-${project.projectNumber}-${revision}`,
          status: DocumentStatus.DRAFT,
          approvalStatus: ApprovalStatus.PENDING,
          totalEstimatedCost: totalCost,
          remarks: dto.remarks,
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
              materialId: item.materialId || defaultMatId,
              rawSize: item.rawSize,
              dimensions: item.dimensions,
              hsnCode: item.hsnCode,
              calculatedWeight: item.calculatedWeight,
              requiredQty: item.requiredQty,
              estimatedCost: item.estimatedCost || 0,
              catalogSize: item.catalogSize,
              stockSize: item.stockSize,
              remarks: item.remarks,
              customFields: { 
                gstPercent: item.gstPercent || 18, 
                ...(item.customFields || {}) 
              },
              createdBy: userId,
              updatedBy: userId,
            },
          })
        )
      );

      // 5. Record activity
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'BOM_CREATED',
          description: `BOM Rev ${revision} submitted with ${dto.items.length} items. Est Cost: ₹${totalCost}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return bomHeader;
    });
  }

  async approveBom(projectId: string, bomId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch project, plant company and BOM
      const project = await tx.project.findFirst({ 
        where: {
          OR: [
            { id: projectId },
            { projectNumber: projectId }
          ]
        },
        include: { customer: true, plant: { include: { company: true } } }
      });

      if (!project) {
        throw new NotFoundException(`Project not found for ID or project number '${projectId}'.`);
      }

      const targetProjectId = project.id;

      const bom = await tx.billOfMaterialHeader.findFirstOrThrow({
        where: { id: bomId, projectId: targetProjectId },
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
      await tx.projectCostSummary.update({
        where: { projectId: targetProjectId },
        data: {
          estimatedMaterialCost: bom.totalEstimatedCost,
        },
      });

      // Also record the Estimated Cost event in project_cost_events for detailed auditing
      await tx.projectCostEvent.create({
        data: {
          projectId: targetProjectId,
          costType: 'ESTIMATED_MATERIAL',
          description: `Base material estimate defined by BOM Rev ${bom.revision} Approval`,
          amount: bom.totalEstimatedCost,
          referenceDocType: 'BOM',
          referenceDocId: bom.id,
          createdBy: userId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'BOM_APPROVED',
          description: `BOM Approved by Engineering. Project transitioned to PROCUREMENT.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 5. Automation: Auto-Generate Draft PO for required materials
      try {
        // Cleanup previous stale auto-generated POs for this project
        const stalePos = await tx.purchaseOrderHeader.findMany({
          where: { 
            projectId: targetProjectId, 
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
          // Check stock vs required for each item (assuming requiredQty needs to be ordered fully for toolroom project)
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

            const poCount = await tx.purchaseOrderHeader.count();
            const seqStr = (poCount + 1).toString().padStart(4, '0');
            const poNumber = `PO-AUTO-${project.projectNumber}-${seqStr}`;
            const rmSlipNo = `PUR/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear()+1).toString().slice(-2)}/${seqStr}`;
            
            const poHeader = await tx.purchaseOrderHeader.create({
              data: {
                projectId: targetProjectId,
                vendorId: defaultVendor.id,
                poNumber: poNumber,
                status: 'DRAFT',
                totalAmount: poTotal,
                createdBy: 'SYSTEM',
                remarks: 'Auto-generated from Approved BOM',
                customFields: {
                  vendorName: defaultVendor.vendorName,
                  vendorAddress: defaultVendor.address,
                  customerName: project.customer?.companyName || "",
                  customerLocation: project.customer?.billingAddress || "",
                  rmSlipNo: rmSlipNo,
                  date: new Date().toISOString()
                }
              }
            });

            await Promise.all(itemsWithRates.map((item, index) => {
              const cf: any = item.customFields || {};
              const gstPercent = Number(cf?.gstPercent || 18);
              const finalCost = Number(item.finalCost || 0);
              const companyGst = project.plant?.company?.gstNumber || '';
              const vendorGst = defaultVendor?.gstNumber || '';
              
              const companyStateCode = companyGst.trim().slice(0, 2);
              const vendorStateCode = vendorGst.trim().slice(0, 2);
              
              const isIntrastate = !vendorStateCode || !companyStateCode || vendorStateCode === companyStateCode;
              
              const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;
              const rawCgst = isIntrastate ? (finalCost * (gstPercent / 100)) / 2 : 0;
              const rawSgst = isIntrastate ? (finalCost * (gstPercent / 100)) / 2 : 0;
              const rawIgst = isIntrastate ? 0 : finalCost * (gstPercent / 100);

              const cgst = round2(rawCgst);
              const sgst = round2(rawSgst);
              const igst = round2(rawIgst);
              const totalGst = round2(cgst + sgst + igst);
              const totalAmount = round2(finalCost + totalGst);

              return tx.purchaseOrderItem.create({
                data: {
                  poHeaderId: poHeader.id,
                  materialId: item.materialId,
                  orderedQty: item.qtyToOrder,
                  agreedRate: item.calculatedRate,
                  lineTotal: item.finalCost,
                  dimensions: item.dimensions,
                  hsnCode: item.hsnCode,
                  gstPercent: gstPercent,
                  remarks: 'Auto-generated item',
                  customFields: {
                    cgst,
                    sgst,
                    igst,
                    basicValue: round2(finalCost),
                    srNo: cf.srNo || (index + 1),
                    toolNo: project.projectNumber || "",
                    detNo: cf.srNo || (index + 1),
                    L: cf.length || 0,
                    W: cf.width || 0,
                    H: cf.height || 0,
                    material: item.material?.materialGrade || item.material?.materialCode || "",
                    qty: item.qtyToOrder,
                    apWt: cf.apWeight || item.calculatedWeight || 0,
                    totalWt: cf.totalWeight || item.calculatedWeight || 0,
                    rate: item.calculatedRate,
                    basicCost: round2(finalCost),
                    gst: totalGst,
                    total: totalAmount
                  }
                }
              })
            }));

            await tx.projectActivity.create({
              data: {
                projectId: targetProjectId,
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
      const project = await tx.project.findFirst({ 
        where: {
          OR: [
            { id: projectId },
            { projectNumber: projectId }
          ]
        }
      });
      if (!project) {
        throw new NotFoundException(`Project not found for ID or project number '${projectId}'.`);
      }
      const targetProjectId = project.id;
      const bom = await tx.billOfMaterialHeader.findFirstOrThrow({ where: { id: bomId, projectId: targetProjectId } });

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
          projectId: targetProjectId,
          action: 'BOM_REJECTED',
          description: `BOM Rev ${bom.revision} Rejected. Reason: ${remarks || 'No reason provided'}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return rejectedBom;
    });
  }

  async getBom(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    if (!project) return null;
    return this.prisma.billOfMaterialHeader.findFirst({
      where: { projectId: project.id, status: { not: DocumentStatus.OBSOLETE } },
      include: { items: { include: { material: true } } },
    });
  }

}


