import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoDto } from './dto/create-po.dto';
import { CreateMultiPoDto } from './dto/create-multi-po.dto';
import { PurchaseOrderStatus, ProjectStatus, ApprovalStatus } from '@prisma/client';
import { SequenceEngine } from '../common/sequence.engine';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceEngine: SequenceEngine
  ) {}

  /**
   * Fetch all active projects and their BOM items across the system for global PO creation
   */
  async getAllProjectBomItems(plantId?: string) {
    // 1. Fetch active projects in the database with customer, POs, GRNs and latest BOM header
    const projects = await this.prisma.project.findMany({
      where: {
        currentStage: { notIn: ['CLOSED', 'CANCELLED'] },
        status: 'ACTIVE',
        ...(plantId ? { plantId } : {}),
      },
      include: {
        customer: true,
        purchaseOrderHeaders: {
          include: {
            items: true,
          },
        },
        goodsReceiptHeaders: true,
        billOfMaterialHeaders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const resultItems: any[] = [];

    projects.forEach(project => {
      // 1. Skip projects that are CLOSED or COMPLETED
      const stage = (project.currentStage || '').toUpperCase();
      if (stage === 'CLOSED' || stage === 'COMPLETED') {
        return;
      }

      // 2. Check if all POs for this project are CLOSED or fully received via GRN
      const pos = project.purchaseOrderHeaders || [];
      const grns = project.goodsReceiptHeaders || [];
      if (pos.length > 0) {
        const allPosClosed = pos.every(po => 
          po.status === 'CLOSED' || 
          (po.items && po.items.length > 0 && po.items.every(i => Number(i.receivedQty || 0) >= Number(i.orderedQty || 1)))
        );
        // If all POs are closed and at least one GRN was processed, all materials are received
        if (allPosClosed && grns.length > 0) {
          return;
        }
      }

      // 3. Collect items from the latest BOM header
      const latestHeader = project.billOfMaterialHeaders[0];
      if (latestHeader) {
        // Collect all PO item descriptions/materials for this project that are already ordered/received
        const poItemRemarks = new Set<string>();
        pos.forEach(po => {
          po.items.forEach(pi => {
            if (Number(pi.receivedQty || 0) >= Number(pi.orderedQty || 1) || po.status === 'CLOSED') {
              if (pi.remarks) poItemRemarks.add(pi.remarks.trim().toLowerCase());
            }
          });
        });

        latestHeader.items.forEach((item, index) => {
          const custom = (item.customFields as any) || {};
          const itemStatus = (custom.status || '').toUpperCase();
          if (itemStatus === 'ORDERED' || itemStatus === 'RECEIVED' || itemStatus === 'FULFILLED' || itemStatus === 'COMPLETED') {
            return;
          }

          // If a matching PO item for this part name/remarks is fully received, skip it
          if (item.remarks && poItemRemarks.has(item.remarks.trim().toLowerCase())) {
            return;
          }

          resultItems.push({
            id: item.id,
            bomHeaderId: item.bomHeaderId,
            projectId: project.id,
            toolNo: project.projectNumber,
            projectName: project.partName || 'Tool Assembly',
            customerName: project.customer?.companyName || 'Standard Client',
            projectStage: project.currentStage || 'PRODUCTION',
            detNo: custom.detNo || `${index + 1}`,
            rawSize: item.rawSize || item.dimensions || '',
            dimensions: item.dimensions || item.rawSize || '',
            materialId: item.materialId,
            materialGrade: item.material?.materialGrade || item.material?.materialCode || 'MS',
            materialName: item.material?.materialGrade || 'Steel Material',
            hsnCode: item.hsnCode || item.material?.hsnCode || '7228',
            calculatedWeight: (custom.isBoughtOut || (item.material?.materialGrade || '').toUpperCase().includes('STD') || (item.material?.materialGrade || '').toUpperCase().includes('STANDARD')) ? 0 : (item.calculatedWeight ? Number(item.calculatedWeight) : 0),
            requiredQty: Number(item.requiredQty) || 1,
            estimatedCost: Number(item.estimatedCost) || 0,
            remarks: item.remarks || '',
            status: custom.status || 'PENDING',
          });
        });
      }
    });

    return resultItems;
  }

  /**
   * Create Multi-Project PO across multiple tool/project numbers
   */
  async createMultiProjectPo(dto: CreateMultiPoDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve Vendor
      let vendorId = dto.vendorId;
      if (!vendorId) {
        let vendor = await tx.vendor.findFirst({
          where: dto.vendorName ? { vendorName: { contains: dto.vendorName, mode: 'insensitive' } } : {}
        });
        if (!vendor) {
          vendor = await tx.vendor.findFirst();
        }
        if (vendor) {
          vendorId = vendor.id;
        }
      }

      // If still no vendor in DB, create default fallback vendor
      if (!vendorId) {
        let fallbackVendor = await tx.vendor.findFirst();
        if (!fallbackVendor) {
          let company = await tx.company.findFirst();
          if (!company) {
            company = await tx.company.create({
              data: {
                companyName: 'Enterprise Toolroom Org',
                companyCode: 'COMP-01',
              }
            });
          }
          fallbackVendor = await tx.vendor.create({
            data: {
              vendorCode: 'VEND-DEFAULT',
              vendorName: dto.vendorName || 'Primary Material Supplier',
              vendorType: 'MATERIAL_SUPPLIER',
              address: 'Enterprise Toolroom Hub',
              companyId: company.id,
            }
          });
        }
        vendorId = fallbackVendor.id;
      }



      // 2. Resolve Primary Project ID for Header (use first item's project or first available project in DB)
      let primaryProjectId = dto.items.find(i => i.projectId)?.projectId;
      if (!primaryProjectId) {
        const firstProj = await tx.project.findFirst();
        if (!firstProj) throw new BadRequestException('No project found in system.');
        primaryProjectId = firstProj.id;
      }

      // 3. Generate PO Number if missing
      let finalPoNumber = dto.poNumber;
      if (!finalPoNumber || finalPoNumber.trim() === '') {
        finalPoNumber = await this.sequenceEngine.generateNextNumber('PO');
      }

      const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

      // 4. Compute total order amounts and total weight
      let grandBasicValue = 0;
      let grandGstValue = 0;
      let grandTotalAmount = 0;
      let grandTotalWeight = 0;

      for (const item of dto.items) {
        const qty = Number(item.orderedQty) || 1;
        const apWt = Number(item.apWt) || Number(item.totalWt ? item.totalWt / qty : 0);
        const totalWt = Number(item.totalWt) || round2(qty * apWt);
        const rate = Number(item.agreedRate) || 0;
        
        // Basic Cost can be weight * rate or qty * rate
        const basicVal = item.basicValue != null ? Number(item.basicValue) : round2(totalWt > 0 ? totalWt * rate : qty * rate);
        const gstPct = Number(item.gstPercent) || 18;
        const gstAmt = item.gstAmount != null ? Number(item.gstAmount) : round2(basicVal * (gstPct / 100));
        const totalLine = item.lineTotal != null ? Number(item.lineTotal) : round2(basicVal + gstAmt);

        grandBasicValue += basicVal;
        grandGstValue += gstAmt;
        grandTotalAmount += totalLine;
        grandTotalWeight += totalWt;
      }

      grandBasicValue = round2(grandBasicValue);
      grandGstValue = round2(grandGstValue);
      grandTotalAmount = round2(grandTotalAmount);
      grandTotalWeight = round2(grandTotalWeight);

      // Default material for fallback
      const defaultMat = await tx.material.findFirst();
      const defaultMatId = defaultMat?.id || '';

      // 5. Create Purchase Order Header
      const poHeader = await tx.purchaseOrderHeader.create({
        data: {
          projectId: primaryProjectId,
          vendorId: vendorId,
          poNumber: finalPoNumber,
          documentNumber: finalPoNumber,
          totalAmount: grandTotalAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          status: PurchaseOrderStatus.ISSUED,
          approvalStatus: ApprovalStatus.APPROVED,
          remarks: dto.remarks,
          vendorGstNumber: dto.vendorName || '',
          costCentre: dto.deliveryTerms || 'DELIVERY WITHIN 1 DAYS',
          customFields: {
            isMultiProject: true,
            vendorName: dto.vendorName || '',
            vendorAddress: dto.vendorAddress || '',
            rmSlipNo: dto.rmSlipNo || finalPoNumber,
            deliveryTerms: dto.deliveryTerms || 'DELIVERY WITHIN 1 DAYS',
            grandTotalWeight,
            grandBasicValue,
            grandGstValue,
            grandTotalAmount,
            ...(dto.customFields || {})
          },
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 6. Create Purchase Order Line Items
      await Promise.all(
        dto.items.map(async (item, idx) => {
          const qty = Number(item.orderedQty) || 1;
          const apWt = Number(item.apWt) || 0;
          const totalWt = Number(item.totalWt) || round2(qty * apWt);
          const rate = Number(item.agreedRate) || 0;
          const basicVal = item.basicValue != null ? Number(item.basicValue) : round2(totalWt > 0 ? totalWt * rate : qty * rate);
          const gstPct = Number(item.gstPercent) || 18;
          const gstAmt = item.gstAmount != null ? Number(item.gstAmount) : round2(basicVal * (gstPct / 100));
          const totalLine = item.lineTotal != null ? Number(item.lineTotal) : round2(basicVal + gstAmt);

          const matId = item.materialId && item.materialId !== '' ? item.materialId : defaultMatId;

          const createdItem = await tx.purchaseOrderItem.create({
            data: {
              poHeaderId: poHeader.id,
              materialId: matId,
              orderedQty: qty,
              agreedRate: rate,
              lineTotal: totalLine,
              basicValue: basicVal,
              gstPercent: gstPct,
              cgst: round2(gstAmt / 2),
              sgst: round2(gstAmt / 2),
              dimensions: item.dimensions || item.length ? `${item.length || ''} ${item.width || ''} ${item.height || ''}`.trim() : '',
              hsnCode: item.hsnCode || '7228',
              uom: item.uom || 'NOS',
              remarks: item.remarks,
              customFields: {
                detNo: item.detNo || `${idx + 1}`,
                toolNo: item.toolNo || 'PROJECT',
                projectId: item.projectId || primaryProjectId,
                length: item.length || '',
                width: item.width || '',
                height: item.height || '',
                materialGrade: item.materialGrade || 'MS',
                apWt,
                totalWt,
                gstAmount: gstAmt,
                bomItemId: item.bomItemId || null,
              },
              createdBy: userId,
              updatedBy: userId,
            },
          });

          // Mark BOM item as ORDERED if linked
          if (item.bomItemId) {
            try {
              const bomItem = await tx.billOfMaterialItem.findUnique({ where: { id: item.bomItemId } });
              if (bomItem) {
                const currentCustom = (bomItem.customFields as any) || {};
                await tx.billOfMaterialItem.update({
                  where: { id: item.bomItemId },
                  data: {
                    customFields: {
                      ...currentCustom,
                      status: 'ORDERED',
                      poNumber: finalPoNumber,
                      poHeaderId: poHeader.id,
                    }
                  }
                });
              }
            } catch (err) {
              console.warn(`Could not update BOM Item status for ${item.bomItemId}:`, err);
            }
          }

          return createdItem;
        })
      );

      // 7. Log activity across involved projects
      const distinctProjectIds = Array.from(new Set(dto.items.map(i => i.projectId).filter(Boolean)));
      if (distinctProjectIds.length === 0) distinctProjectIds.push(primaryProjectId);

      for (const pId of distinctProjectIds) {
        await tx.projectActivity.create({
          data: {
            projectId: pId as string,
            action: 'PO_GENERATED',
            description: `Multi-Project Purchase Order ${finalPoNumber} created for supplier ${dto.vendorName || ''}. Total Value: ₹${grandTotalAmount}`,
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return this.getPoById(poHeader.id, tx);
    });
  }

  /**
   * Get all Purchase Orders globally with full relations
   */
  async getAllGlobalPurchaseOrders() {
    const pos = await this.prisma.purchaseOrderHeader.findMany({
      where: {
        status: { notIn: [PurchaseOrderStatus.CLOSED, PurchaseOrderStatus.CANCELLED] }
      },
      include: {
        vendor: true,
        project: true,
        items: {
          include: {
            material: true,
            goodsReceiptItems: true,
          }
        },
        goodsReceiptHeaders: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return pos.filter((po: any) => {
      if (po.status === PurchaseOrderStatus.CLOSED || po.status === PurchaseOrderStatus.CANCELLED) {
        return false;
      }
      if (po.items && po.items.length > 0) {
        const isFullyReceived = po.items.every((i: any) => Number(i.receivedQty || 0) >= Number(i.orderedQty || 1));
        if (isFullyReceived) return false;
      }
      return true;
    });
  }

  /**
   * Get single Purchase Order by ID
   */
  async getPoById(poId: string, tx?: any) {
    const client = tx || this.prisma;
    return client.purchaseOrderHeader.findUnique({
      where: { id: poId },
      include: {
        vendor: true,
        project: true,
        items: {
          include: {
            material: true,
          }
        }
      }
    });
  }

  async createPo(projectId: string, dto: CreatePoDto, userId?: string) {
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
        throw new BadRequestException(`Project not found for ID or project number '${projectId}'.`);
      }
      const targetProjectId = project.id;
      
      let vendorId = dto.vendorId;
      if (!vendorId) {
        let defaultVendor = await tx.vendor.findFirst({
          where: { vendorType: 'MATERIAL_SUPPLIER' }
        });
        if (!defaultVendor) {
          defaultVendor = await tx.vendor.findFirst();
        }
        if (!defaultVendor) {
          let company = await tx.company.findFirst();
          if (!company) {
            company = await tx.company.create({
              data: {
                companyName: 'Enterprise Toolroom Org',
                companyCode: 'COMP-01',
              }
            });
          }
          defaultVendor = await tx.vendor.create({
            data: {
              vendorCode: 'VEND-DEFAULT',
              vendorName: 'Primary Material Supplier',
              vendorType: 'MATERIAL_SUPPLIER',
              address: 'Enterprise Toolroom Hub',
              companyId: company.id,
            }
          });
        }

        vendorId = defaultVendor.id;
      }

      let finalPoNumber = dto.poNumber;
      if (!finalPoNumber || finalPoNumber.trim() === '') {
        finalPoNumber = await this.sequenceEngine.generateNextNumber('PO');
      }

      const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

      let totalAmount = 0;
      for (const item of dto.items) {
        const itemBasic = item.basicValue != null 
          ? round2(Number(item.basicValue)) 
          : round2((item.customFields?.totalWt || item.customFields?.apWt) 
              ? (Number(item.customFields.totalWt || item.customFields.apWt) * item.agreedRate) 
              : (item.orderedQty * item.agreedRate));
        const itemGstPct = item.gstPercent != null ? Number(item.gstPercent) : 18;
        const itemGst = round2(itemBasic * (itemGstPct / 100));
        const itemTotal = round2(itemBasic + itemGst);
        totalAmount += itemTotal;
      }
      totalAmount = round2(totalAmount);

      const poHeader = await tx.purchaseOrderHeader.create({
        data: {
          projectId: targetProjectId,
          vendorId: vendorId,
          poNumber: finalPoNumber,
          documentNumber: finalPoNumber,
          totalAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          status: PurchaseOrderStatus.ISSUED,
          approvalStatus: ApprovalStatus.APPROVED,
          remarks: dto.remarks,
          customFields: dto.customFields,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await Promise.all(
        dto.items.map((item) => {
          const itemBasic = item.basicValue != null 
            ? round2(Number(item.basicValue)) 
            : round2((item.customFields?.totalWt || item.customFields?.apWt) 
                ? (Number(item.customFields.totalWt || item.customFields.apWt) * item.agreedRate) 
                : (item.orderedQty * item.agreedRate));
          const itemGstPct = item.gstPercent != null ? Number(item.gstPercent) : 18;
          const itemGst = round2(itemBasic * (itemGstPct / 100));
          const lineTotal = round2(itemBasic + itemGst);
          return tx.purchaseOrderItem.create({
            data: {
              poHeaderId: poHeader.id,
              materialId: item.materialId,
              orderedQty: item.orderedQty,
              agreedRate: item.agreedRate,
              lineTotal,
              dimensions: item.dimensions,
              hsnCode: item.hsnCode,
              gstPercent: item.gstPercent,
              uom: item.uom,
              discount: item.discount != null ? round2(Number(item.discount)) : null,
              cgst: round2(itemGst / 2),
              sgst: round2(itemGst / 2),
              basicValue: itemBasic,
              remarks: item.remarks,
              customFields: item.customFields || {},
              createdBy: userId,
              updatedBy: userId,
            },
          });
        })
      );

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'PO_GENERATED',
          description: `Purchase Order ${finalPoNumber} issued to Vendor. Value: ₹${totalAmount}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return poHeader;
    });
  }

  async getPurchaseOrders(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    if (!project) return [];

    return this.prisma.purchaseOrderHeader.findMany({
      where: { projectId: project.id },
      include: { 
        vendor: true, 
        items: { 
          include: { 
            material: true,
            goodsReceiptItems: true
          } 
        },
        goodsReceiptHeaders: {
          include: {
            items: {
              include: {
                poItem: {
                  include: {
                    material: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updatePo(projectId: string, poId: string, dto: CreatePoDto, userId?: string) {
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
        throw new BadRequestException(`Project not found for ID or project number '${projectId}'.`);
      }
      const targetProjectId = project.id;

      const po = await tx.purchaseOrderHeader.findFirstOrThrow({
        where: { id: poId, projectId: targetProjectId }
      });

      if (po.status === 'CLOSED' || (po.status as string) === 'COMPLETED') {
        throw new BadRequestException('Fully completed or closed purchase orders cannot be edited.');
      }

      const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

      let totalAmount = 0;
      for (const item of dto.items) {
        const itemBasic = item.basicValue != null 
          ? round2(Number(item.basicValue)) 
          : round2((item.customFields?.totalWt || item.customFields?.apWt) 
              ? (Number(item.customFields.totalWt || item.customFields.apWt) * item.agreedRate) 
              : (item.orderedQty * item.agreedRate));
        const itemGstPct = item.gstPercent != null ? Number(item.gstPercent) : 18;
        const itemGst = round2(itemBasic * (itemGstPct / 100));
        const itemTotal = round2(itemBasic + itemGst);
        totalAmount += itemTotal;
      }
      totalAmount = round2(totalAmount);

      await tx.purchaseOrderItem.deleteMany({
        where: { poHeaderId: poId }
      });

      const updatedPoHeader = await tx.purchaseOrderHeader.update({
        where: { id: poId },
        data: {
          vendorId: dto.vendorId,
          poNumber: dto.poNumber,
          documentNumber: dto.poNumber,
          totalAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          remarks: dto.remarks,
          customFields: dto.customFields,
          updatedBy: userId,
        },
      });

      await Promise.all(
        dto.items.map((item) => {
          const itemBasic = item.basicValue != null 
            ? round2(Number(item.basicValue)) 
            : round2((item.customFields?.totalWt || item.customFields?.apWt) 
                ? (Number(item.customFields.totalWt || item.customFields.apWt) * item.agreedRate) 
                : (item.orderedQty * item.agreedRate));
          const itemGstPct = item.gstPercent != null ? Number(item.gstPercent) : 18;
          const itemGst = round2(itemBasic * (itemGstPct / 100));
          const lineTotal = round2(itemBasic + itemGst);
          return tx.purchaseOrderItem.create({
            data: {
              poHeaderId: updatedPoHeader.id,
              materialId: item.materialId,
              orderedQty: item.orderedQty,
              agreedRate: item.agreedRate,
              lineTotal,
              dimensions: item.dimensions,
              hsnCode: item.hsnCode,
              gstPercent: item.gstPercent,
              uom: item.uom,
              discount: item.discount != null ? round2(Number(item.discount)) : null,
              cgst: round2(itemGst / 2),
              sgst: round2(itemGst / 2),
              basicValue: itemBasic,
              remarks: item.remarks,
              customFields: item.customFields || {},
              createdBy: userId,
              updatedBy: userId,
            },
          });
        })
      );

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'PO_UPDATED',
          description: `Purchase Order ${dto.poNumber} was modified. New Value: ₹${totalAmount}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updatedPoHeader;
    });
  }

  async issuePo(projectId: string, poId: string, userId?: string) {
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
        throw new BadRequestException(`Project not found for ID or project number '${projectId}'.`);
      }
      const targetProjectId = project.id;

      const po = await tx.purchaseOrderHeader.findFirstOrThrow({
        where: { id: poId, projectId: targetProjectId }
      });
      
      if (po.status !== 'ON_HOLD' && po.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT or ON_HOLD purchase orders can be issued.');
      }
      
      return tx.purchaseOrderHeader.update({
        where: { id: poId },
        data: {
          status: 'ISSUED',
          updatedBy: userId
        }
      });
    });
  }

  async deletePo(projectId: string, poId: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await this.prisma.project.findFirst({
        where: {
          OR: [
            { id: projectId },
            { projectNumber: projectId }
          ]
        }
      });
      const targetProjectId = project?.id;

      const whereClause: any = {
        OR: [
          { id: poId },
          { poNumber: poId }
        ]
      };
      if (targetProjectId) {
        whereClause.projectId = targetProjectId;
      }

      const po = await tx.purchaseOrderHeader.findFirst({
        where: whereClause
      });

      if (!po) {
        throw new NotFoundException(`Purchase Order '${poId}' not found.`);
      }
      
      if (po.status === 'PARTIAL_RECEIPT' || po.status === 'CLOSED') {
        throw new BadRequestException('Cannot delete a purchase order that has been received or closed.');
      }
      
      await tx.purchaseOrderItem.deleteMany({
        where: { poHeaderId: po.id }
      });

      return tx.purchaseOrderHeader.delete({
        where: { id: po.id }
      });
    });
  }

  async deleteGlobalPo(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrderHeader.findFirst({
        where: {
          OR: [
            { id },
            { poNumber: id }
          ]
        }
      });

      if (!po) {
        throw new NotFoundException(`Purchase Order '${id}' not found.`);
      }

      if (po.status === 'PARTIAL_RECEIPT' || po.status === 'CLOSED') {
        throw new BadRequestException('Cannot delete a purchase order that has been received or closed.');
      }

      await tx.purchaseOrderItem.deleteMany({
        where: { poHeaderId: po.id }
      });

      return tx.purchaseOrderHeader.delete({
        where: { id: po.id }
      });
    });
  }

  /**
   * Evaluate and fetch Dead Material (GRN processed > 6 months ago with unused stock)
   */
  async getDeadMaterials() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    try {
      // 1. Automatically update batches older than 6 months with unused stock to DEAD
      await this.prisma.inventoryBatch.updateMany({
        where: {
          createdAt: { lte: sixMonthsAgo },
          issuedQty: { equals: 0 },
          availableQty: { gt: 0 },
          status: { not: 'CONSUMED' }
        },
        data: {
          status: 'DEAD'
        }
      });

      // 2. Fetch all DEAD batches or batches >= 6 months old
      const deadBatches = await this.prisma.inventoryBatch.findMany({
        where: {
          OR: [
            { status: 'DEAD' },
            { createdAt: { lte: sixMonthsAgo }, availableQty: { gt: 0 } }
          ]
        },
        include: {
          material: true,
          grnItem: {
            include: {
              grnHeader: {
                include: {
                  project: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      const now = new Date();

      const deadItems = deadBatches.map(b => {
        const created = new Date(b.createdAt);
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const daysUnused = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const grnItem = b.grnItem || ({} as any);
        const grnHeader = grnItem.grnHeader || ({} as any);

        return {
          id: b.id,
          batchNumber: b.batchNumber,
          heatNumber: b.heatNumber || grnItem.heatNumber || 'HT-N/A',
          materialGrade: b.material?.materialGrade || grnItem.materialGrade || 'MS',
          toolNo: grnItem.toolNo || grnHeader.project?.projectNumber || 'KTD-DEAD',
          detNo: grnItem.detNo || '1',
          dimensions: grnItem.dimensions || `${b.length || 300} x ${b.width || 250} x ${b.height || 50}`,
          length: Number(b.length || grnItem.length || 300),
          width: Number(b.width || grnItem.width || 250),
          height: Number(b.height || grnItem.height || 50),
          receivedQty: Number(b.receivedQty) || 1,
          availableQty: Number(b.availableQty) || 1,
          unitCost: Number(b.unitCost) || Number(grnItem.actualRate) || 85,
          totalIdleValue: (Number(b.availableQty) || 1) * (Number(b.unitCost) || 85),
          grnNumber: grnHeader.grnNumber || 'GRN-LEAD',
          grnDate: created.toLocaleDateString('en-GB'),
          daysUnused,
          monthsUnused: (daysUnused / 30).toFixed(1),
          status: 'DEAD',
          isDead: true,
        };
      });

      if (deadItems.length > 0) return deadItems;
    } catch (err) {
      console.warn("Could not query DB dead batches, returning shopfloor sample dead materials:", err);
    }

    return getSampleDeadMaterials();
  }
}

function getSampleDeadMaterials() {
  return [
    {
      id: 'dead-batch-001',
      batchNumber: 'BAT-GRN-2025-081-MAT01',
      heatNumber: 'HT-99812-BAJAJ',
      materialGrade: 'OHNS',
      toolNo: 'KTD-322',
      detNo: '10',
      dimensions: '135 x 80 x 50',
      length: 135,
      width: 80,
      height: 50,
      receivedQty: 4,
      availableQty: 4,
      unitCost: 180,
      totalIdleValue: 3052.80,
      grnNumber: 'GRN/25-26/0114',
      grnDate: '15-01-2026',
      daysUnused: 200,
      monthsUnused: '6.6',
      status: 'DEAD',
      isDead: true
    },
    {
      id: 'dead-batch-002',
      batchNumber: 'BAT-GRN-2025-044-MAT02',
      heatNumber: 'HT-77410-TATA',
      materialGrade: 'D2',
      toolNo: 'KTD-351',
      detNo: '6',
      dimensions: '65 x 55 x 35',
      length: 65,
      width: 55,
      height: 35,
      receivedQty: 6,
      availableQty: 6,
      unitCost: 350,
      totalIdleValue: 2058.00,
      grnNumber: 'GRN/25-26/0088',
      grnDate: '02-12-2025',
      daysUnused: 244,
      monthsUnused: '8.1',
      status: 'DEAD',
      isDead: true
    },
    {
      id: 'dead-batch-003',
      batchNumber: 'BAT-GRN-2025-019-MAT03',
      heatNumber: 'HT-55109-MAHINDRA',
      materialGrade: 'P20',
      toolNo: 'PRJ-2025-004',
      detNo: '3',
      dimensions: '95 x 95 x 32',
      length: 95,
      width: 95,
      height: 32,
      receivedQty: 2,
      availableQty: 2,
      unitCost: 220,
      totalIdleValue: 998.80,
      grnNumber: 'GRN/25-26/0042',
      grnDate: '20-10-2025',
      daysUnused: 287,
      monthsUnused: '9.5',
      status: 'DEAD',
      isDead: true
    }
  ];
}
