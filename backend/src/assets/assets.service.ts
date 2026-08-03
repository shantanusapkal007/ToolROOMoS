import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto } from './dto/create-asset.dto';
import { IssueAssetDto } from './dto/issue-asset.dto';
import { ReturnAssetDto } from './dto/return-asset.dto';
import { CreateMaintenanceDto, CompleteMaintenanceDto } from './dto/create-maintenance.dto';
import { CreateCategoryDto, CreateLocationDto } from './dto/create-category-location.dto';
import { GlobalAssetStatus, GlobalAssetIssueStatus, GlobalAssetMaintenanceStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // DASHBOARD & STATS
  // -------------------------------------------------------------
  async getDashboardStats() {
    const assets = await this.prisma.globalAsset.findMany({
      include: {
        category: true,
        issueTransactions: {
          where: { status: { in: ['ISSUED', 'PARTIALLY_RETURNED', 'OVERDUE'] } },
          include: { employee: { include: { department: true } } }
        }
      }
    });

    const now = new Date();

    let totalAssets = assets.length;
    let totalQuantity = 0;
    let availableCount = 0;
    let issuedCount = 0;
    let overdueCount = 0;
    let maintenanceCount = 0;
    let lostCount = 0;
    let scrappedCount = 0;

    const categoryMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    const deptMap: Record<string, number> = {};

    assets.forEach((asset) => {
      const q = Number(asset.quantity);
      totalQuantity += q;

      statusMap[asset.status] = (statusMap[asset.status] || 0) + 1;
      const catName = asset.category?.name || 'Uncategorized';
      categoryMap[catName] = (categoryMap[catName] || 0) + 1;

      if (asset.status === 'AVAILABLE') availableCount++;
      if (asset.status === 'ISSUED') issuedCount++;
      if (asset.status === 'MAINTENANCE') maintenanceCount++;
      if (asset.status === 'LOST') lostCount++;
      if (asset.status === 'SCRAPPED') scrappedCount++;

      asset.issueTransactions.forEach((tx) => {
        if (tx.expectedReturnDate && new Date(tx.expectedReturnDate) < now && tx.status !== 'RETURNED') {
          overdueCount++;
        }
        const dept = tx.employee?.department?.departmentName || 'General';
        deptMap[dept] = (deptMap[dept] || 0) + Number(tx.quantity);
      });
    });

    // Most issued assets
    const topIssued = await this.prisma.globalAssetIssueTransaction.groupBy({
      by: ['assetId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const topAssetDetails = await Promise.all(
      topIssued.map(async (item) => {
        const ast = await this.prisma.globalAsset.findUnique({
          where: { id: item.assetId },
          select: { name: true, assetId: true, assetCode: true }
        });
        return {
          assetName: ast?.name || 'Unknown',
          assetCode: ast?.assetCode || '',
          issueCount: item._count.id
        };
      })
    );

    return {
      cards: {
        totalAssets,
        totalQuantity,
        availableAssets: availableCount,
        issuedAssets: issuedCount,
        overdueAssets: overdueCount,
        maintenanceAssets: maintenanceCount,
        lostAssets: lostCount,
        scrappedAssets: scrappedCount,
      },
      charts: {
        byCategory: Object.entries(categoryMap).map(([name, count]) => ({ name, count })),
        byStatus: Object.entries(statusMap).map(([name, count]) => ({ name, count })),
        departmentWise: Object.entries(deptMap).map(([name, count]) => ({ name, count })),
        mostIssued: topAssetDetails,
      }
    };
  }

  // -------------------------------------------------------------
  // ASSETS CRUD
  // -------------------------------------------------------------
  async getAssets(query?: { search?: string; categoryId?: string; status?: string; locationId?: string }) {
    const where: any = {};

    if (query?.categoryId) where.categoryId = query.categoryId;
    if (query?.status) where.status = query.status as GlobalAssetStatus;
    if (query?.locationId) where.locationId = query.locationId;

    if (query?.search) {
      const s = query.search;
      where.OR = [
        { assetId: { contains: s, mode: 'insensitive' } },
        { assetCode: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { serialNumber: { contains: s, mode: 'insensitive' } },
        { brand: { contains: s, mode: 'insensitive' } },
        { model: { contains: s, mode: 'insensitive' } },
      ];
    }

    return this.prisma.globalAsset.findMany({
      where,
      include: {
        category: true,
        location: true,
        issueTransactions: {
          where: { status: { in: ['ISSUED', 'PARTIALLY_RETURNED', 'OVERDUE'] } },
          include: { employee: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAssetById(id: string) {
    const asset = await this.prisma.globalAsset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        issueTransactions: {
          include: { employee: true, returns: true },
          orderBy: { createdAt: 'desc' }
        },
        returnTransactions: {
          include: { employee: true, issueTransaction: true },
          orderBy: { createdAt: 'desc' }
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID "${id}" not found.`);
    }

    return asset;
  }

  async createAsset(dto: CreateAssetDto, userId: string = 'SYSTEM') {
    // Generate unique Asset ID (AST-10001)
    const count = await this.prisma.globalAsset.count();
    const assetId = `AST-${10001 + count}`;

    const newAsset = await this.prisma.globalAsset.create({
      data: {
        assetId,
        assetCode: dto.assetCode,
        name: dto.name,
        categoryId: dto.categoryId,
        subCategory: dto.subCategory,
        brand: dto.brand,
        model: dto.model,
        serialNumber: dto.serialNumber,
        partNumber: dto.partNumber,
        description: dto.description,
        quantity: dto.quantity,
        availableQty: dto.quantity,
        issuedQty: 0,
        unit: dto.unit || 'NOS',
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchaseCost: dto.purchaseCost || 0,
        supplier: dto.supplier,
        locationId: dto.locationId,
        storageRack: dto.storageRack,
        condition: dto.condition || 'GOOD',
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
        status: dto.status || 'AVAILABLE',
        qrCode: `QR-${assetId}`,
        barcode: `BC-${dto.assetCode}`,
        imageUrl: dto.imageUrl,
        documentUrls: dto.documentUrls || [],
        createdBy: userId,
      },
      include: { category: true, location: true }
    });

    // Log Audit
    await this.prisma.globalAssetAuditLog.create({
      data: {
        assetId: newAsset.id,
        action: 'CREATED',
        performedBy: userId,
        newValues: newAsset as any,
      }
    });

    return newAsset;
  }

  async updateAsset(id: string, dto: UpdateAssetDto, userId: string = 'SYSTEM') {
    const existing = await this.getAssetById(id);

    const diffQty = dto.quantity - Number(existing.quantity);
    const newAvailable = Math.max(0, Number(existing.availableQty) + diffQty);

    const updated = await this.prisma.globalAsset.update({
      where: { id },
      data: {
        assetCode: dto.assetCode,
        name: dto.name,
        categoryId: dto.categoryId,
        subCategory: dto.subCategory,
        brand: dto.brand,
        model: dto.model,
        serialNumber: dto.serialNumber,
        partNumber: dto.partNumber,
        description: dto.description,
        quantity: dto.quantity,
        availableQty: newAvailable,
        unit: dto.unit,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : existing.purchaseDate,
        purchaseCost: dto.purchaseCost ?? existing.purchaseCost,
        supplier: dto.supplier,
        locationId: dto.locationId,
        storageRack: dto.storageRack,
        condition: dto.condition,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : existing.warrantyExpiry,
        status: dto.status || existing.status,
        imageUrl: dto.imageUrl,
        updatedBy: userId,
      },
      include: { category: true, location: true }
    });

    await this.prisma.globalAssetAuditLog.create({
      data: {
        assetId: id,
        action: 'UPDATED',
        performedBy: userId,
        oldValues: existing as any,
        newValues: updated as any,
      }
    });

    return updated;
  }

  // -------------------------------------------------------------
  // ISSUE ASSET TRANSACTION
  // -------------------------------------------------------------
  async issueAsset(dto: IssueAssetDto, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.globalAsset.findUniqueOrThrow({
        where: { id: dto.assetId }
      });

      const availQty = Number(asset.availableQty);
      if (dto.quantity > availQty) {
        throw new BadRequestException(`Cannot issue ${dto.quantity} items. Only ${availQty} available.`);
      }

      const issueCount = await tx.globalAssetIssueTransaction.count();
      const issueNumber = `ISS-${10001 + issueCount}`;

      const issueTx = await tx.globalAssetIssueTransaction.create({
        data: {
          issueNumber,
          assetId: dto.assetId,
          employeeId: dto.employeeId,
          quantity: dto.quantity,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
          conditionBeforeIssue: dto.conditionBeforeIssue || asset.condition || 'GOOD',
          status: 'ISSUED',
          remarks: dto.remarks,
          createdBy: userId,
        },
        include: { asset: true, employee: true }
      });

      const newAvail = availQty - dto.quantity;
      const newIssued = Number(asset.issuedQty) + dto.quantity;
      const newStatus = newAvail === 0 ? 'ISSUED' : asset.status;

      await tx.globalAsset.update({
        where: { id: dto.assetId },
        data: {
          availableQty: newAvail,
          issuedQty: newIssued,
          status: newStatus,
          updatedBy: userId,
        }
      });

      await tx.globalAssetAuditLog.create({
        data: {
          assetId: dto.assetId,
          action: 'ISSUED',
          performedBy: userId,
          newValues: { issueNumber, employeeId: dto.employeeId, quantity: dto.quantity },
        }
      });

      return issueTx;
    });
  }

  // -------------------------------------------------------------
  // RETURN ASSET TRANSACTION
  // -------------------------------------------------------------
  async returnAsset(dto: ReturnAssetDto, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const issueTx = await tx.globalAssetIssueTransaction.findUniqueOrThrow({
        where: { id: dto.issueTransactionId },
        include: { returns: true, asset: true }
      });

      const issuedQty = Number(issueTx.quantity);
      const totalReturnedSoFar = issueTx.returns.reduce((sum, r) => sum + Number(r.returnedQty), 0);
      const remainingToReturn = issuedQty - totalReturnedSoFar;

      if (dto.returnedQty > remainingToReturn) {
        throw new BadRequestException(`Returned quantity (${dto.returnedQty}) exceeds remaining issued quantity (${remainingToReturn}).`);
      }

      const returnCount = await tx.globalAssetReturnTransaction.count();
      const returnNumber = `RET-${10001 + returnCount}`;

      const returnTx = await tx.globalAssetReturnTransaction.create({
        data: {
          returnNumber,
          issueTransactionId: dto.issueTransactionId,
          assetId: issueTx.assetId,
          employeeId: issueTx.employeeId,
          returnedQty: dto.returnedQty,
          returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
          conditionAfterReturn: dto.conditionAfterReturn || 'GOOD',
          damageDetails: dto.damageDetails,
          remarks: dto.remarks,
          createdBy: userId,
        },
        include: { asset: true, employee: true }
      });

      const newTotalReturned = totalReturnedSoFar + dto.returnedQty;
      const isFullyReturned = newTotalReturned >= issuedQty;
      const issueStatus = isFullyReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';

      await tx.globalAssetIssueTransaction.update({
        where: { id: dto.issueTransactionId },
        data: {
          status: issueStatus,
          actualReturnDate: isFullyReturned ? new Date() : null,
          conditionAfterReturn: dto.conditionAfterReturn,
          updatedBy: userId,
        }
      });

      const asset = issueTx.asset;
      const newAvail = Number(asset.availableQty) + dto.returnedQty;
      const newIssued = Math.max(0, Number(asset.issuedQty) - dto.returnedQty);
      const newStatus = newAvail > 0 && asset.status === 'ISSUED' ? 'AVAILABLE' : asset.status;

      await tx.globalAsset.update({
        where: { id: issueTx.assetId },
        data: {
          availableQty: newAvail,
          issuedQty: newIssued,
          status: newStatus,
          condition: dto.conditionAfterReturn || asset.condition,
          updatedBy: userId,
        }
      });

      await tx.globalAssetAuditLog.create({
        data: {
          assetId: issueTx.assetId,
          action: 'RETURNED',
          performedBy: userId,
          newValues: { returnNumber, returnedQty: dto.returnedQty, isFullyReturned },
        }
      });

      return returnTx;
    });
  }

  // -------------------------------------------------------------
  // MAINTENANCE
  // -------------------------------------------------------------
  async createMaintenance(dto: CreateMaintenanceDto, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.globalAsset.findUniqueOrThrow({ where: { id: dto.assetId } });

      const count = await tx.globalAssetMaintenanceRequest.count();
      const requestNumber = `MNT-${10001 + count}`;

      const mnt = await tx.globalAssetMaintenanceRequest.create({
        data: {
          requestNumber,
          assetId: dto.assetId,
          issueReported: dto.issueReported,
          assignedTechnician: dto.assignedTechnician,
          maintenanceStart: dto.maintenanceStart ? new Date(dto.maintenanceStart) : new Date(),
          cost: dto.cost || 0,
          status: 'PENDING',
          remarks: dto.remarks,
          createdBy: userId,
        },
        include: { asset: true }
      });

      await tx.globalAsset.update({
        where: { id: dto.assetId },
        data: {
          status: 'MAINTENANCE',
          updatedBy: userId,
        }
      });

      await tx.globalAssetAuditLog.create({
        data: {
          assetId: dto.assetId,
          action: 'MAINTENANCE',
          performedBy: userId,
          newValues: { requestNumber, issueReported: dto.issueReported },
        }
      });

      return mnt;
    });
  }

  async completeMaintenance(id: string, dto: CompleteMaintenanceDto, userId: string = 'SYSTEM') {
    return this.prisma.$transaction(async (tx) => {
      const mnt = await tx.globalAssetMaintenanceRequest.findUniqueOrThrow({
        where: { id },
        include: { asset: true }
      });

      const updatedMnt = await tx.globalAssetMaintenanceRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          maintenanceEnd: dto.maintenanceEnd ? new Date(dto.maintenanceEnd) : new Date(),
          cost: dto.cost ?? mnt.cost,
          remarks: dto.remarks || mnt.remarks,
          updatedBy: userId,
        }
      });

      await tx.globalAsset.update({
        where: { id: mnt.assetId },
        data: {
          status: 'AVAILABLE',
          condition: dto.conditionAfterMaintenance || mnt.asset.condition,
          updatedBy: userId,
        }
      });

      await tx.globalAssetAuditLog.create({
        data: {
          assetId: mnt.assetId,
          action: 'MAINTENANCE_COMPLETED',
          performedBy: userId,
          newValues: { requestNumber: mnt.requestNumber, cost: updatedMnt.cost },
        }
      });

      return updatedMnt;
    });
  }

  // -------------------------------------------------------------
  // CATEGORIES & LOCATIONS
  // -------------------------------------------------------------
  async getCategories() {
    let cats = await this.prisma.globalAssetCategory.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' }
    });

    if (cats.length === 0) {
      await this.prisma.globalAssetCategory.createMany({
        data: [
          { categoryCode: 'CAT-MEAS', name: 'Measuring & Inspection Instruments', description: 'Vernier Calipers, Micrometers, Height Gauges, Plug Gauges', createdBy: 'SYSTEM' },
          { categoryCode: 'CAT-CUT', name: 'Cutting Tools & Inserts', description: 'End Mills, Carbide Inserts, Drills, Taps, Reamers', createdBy: 'SYSTEM' },
          { categoryCode: 'CAT-POW', name: 'Power & Hand Tools', description: 'Cordless Drivers, Torque Wrenches, Angle Grinders', createdBy: 'SYSTEM' },
          { categoryCode: 'CAT-FIX', name: 'Fixtures & Workholding', description: 'Vises, Magnetic Chucks, Jigs, Clamps', createdBy: 'SYSTEM' },
          { categoryCode: 'CAT-IT', name: 'IT Assets & Hardware', description: 'Laptops, CAD Workstations, Tablets, Printers', createdBy: 'SYSTEM' },
          { categoryCode: 'CAT-EQP', name: 'Equipment & Machinery', description: 'Tool Presetters, Ultrasonic Cleaners, Marking Machines', createdBy: 'SYSTEM' },
        ],
        skipDuplicates: true,
      });

      cats = await this.prisma.globalAssetCategory.findMany({
        include: { _count: { select: { assets: true } } },
        orderBy: { name: 'asc' }
      });
    }

    return cats;
  }

  async createCategory(dto: CreateCategoryDto, userId: string = 'SYSTEM') {
    return this.prisma.globalAssetCategory.create({
      data: {
        categoryCode: dto.categoryCode,
        name: dto.name,
        description: dto.description,
        createdBy: userId,
      }
    });
  }

  async getLocations() {
    let locs = await this.prisma.globalAssetLocation.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { locationName: 'asc' }
    });

    if (locs.length === 0) {
      await this.prisma.globalAssetLocation.createMany({
        data: [
          { locationCode: 'LOC-TC1', locationName: 'Main Tool Crib Alpha', building: 'Building 1', room: 'Room 102', rackBin: 'Rack A-1', createdBy: 'SYSTEM' },
          { locationCode: 'LOC-QC1', locationName: 'Quality Inspection Lab', building: 'Building 1', room: 'Room 105', rackBin: 'Cabinet B', createdBy: 'SYSTEM' },
          { locationCode: 'LOC-STORE', locationName: 'General Stores Warehouse', building: 'Building 2', room: 'Main Hall', rackBin: 'Bin C-12', createdBy: 'SYSTEM' },
        ],
        skipDuplicates: true,
      });

      locs = await this.prisma.globalAssetLocation.findMany({
        include: { _count: { select: { assets: true } } },
        orderBy: { locationName: 'asc' }
      });
    }

    return locs;
  }

  async createLocation(dto: CreateLocationDto, userId: string = 'SYSTEM') {
    return this.prisma.globalAssetLocation.create({
      data: {
        locationCode: dto.locationCode,
        locationName: dto.locationName,
        building: dto.building,
        room: dto.room,
        rackBin: dto.rackBin,
        remarks: dto.remarks,
        createdBy: userId,
      }
    });
  }

  // -------------------------------------------------------------
  // ISSUE & RETURN LOG LISTS & REPORTS
  // -------------------------------------------------------------
  async getIssueTransactions() {
    return this.prisma.globalAssetIssueTransaction.findMany({
      include: {
        asset: { include: { category: true } },
        employee: { include: { department: true } },
        returns: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getReturnTransactions() {
    return this.prisma.globalAssetReturnTransaction.findMany({
      include: {
        asset: true,
        employee: { include: { department: true } },
        issueTransaction: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMaintenanceRequests() {
    return this.prisma.globalAssetMaintenanceRequest.findMany({
      include: { asset: { include: { category: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
