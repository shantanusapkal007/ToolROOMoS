import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId?: string) {
    const targetDate = dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : null;

    // Use transaction to ensure transactional integrity across objects, timelines, activities, and costs.
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the project
      const project = await tx.project.create({
        data: {
          projectNumber: dto.projectNumber,
          customerPoNumber: dto.customerPoNumber,
          partName: dto.partName,
          description: dto.description,
          targetDeliveryDate: targetDate,
          priority: dto.priority || 'NORMAL',
          projectOwner: dto.projectOwner,
          customerId: dto.customerId,
          plantId: dto.plantId,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
          currentStage: ProjectStatus.CREATED,
        },
      });

      // 2. Initialize Project Cost Summary (Outcome Layer)
      await tx.projectCostSummary.create({
        data: {
          projectId: project.id,
          estimatedMaterialCost: 0,
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
      });

      // 3. Record Initial Project Timeline State (Event Layer)
      await tx.projectTimeline.create({
        data: {
          projectId: project.id,
          fromStage: ProjectStatus.CREATED,
          toStage: ProjectStatus.CREATED,
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Project initialized via Customer PO registration',
        },
      });

      // 4. Record Initial Activity Log
      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          action: 'PROJECT_CREATED',
          description: `Project ${project.projectNumber} registered with status CREATED`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return project;
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.currentStage = query.status as ProjectStatus;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) {
      where.OR = [
        { projectNumber: { contains: query.search, mode: 'insensitive' } },
        { partName: { contains: query.search, mode: 'insensitive' } },
        { customerPoNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        plant: true,
        projectCostSummary: true,
        projectTimeline: { orderBy: { transitionedAt: 'desc' } },
        projectActivities: { orderBy: { performedAt: 'desc' }, take: 10 },
        drawings: true,
        billOfMaterialHeaders: true,
        purchaseOrderHeaders: true,
        goodsReceiptHeaders: true,
        materialIssueHeaders: true,
        machineShopReports: true,
        inspectionHeaders: true,
        dispatchNotes: true,
        invoiceHeaders: true,
        projectTasks: { orderBy: { startDate: 'asc' } },
        inventoryTransactions: {
          include: {
            inventoryBatch: {
              include: {
                material: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    if (dto.targetDeliveryDate) {
      dto.targetDeliveryDate = new Date(dto.targetDeliveryDate).toISOString() as any;
    }
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async updateTimeline(id: string, toStage: ProjectStatus, remarks?: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id } });
      const fromStage = project.currentStage;

      if (fromStage === toStage) {
        throw new BadRequestException('Project is already in this stage.');
      }

      // Update project stage
      const updatedProject = await tx.project.update({
        where: { id },
        data: {
          currentStage: toStage,
          updatedBy: userId,
        },
      });

      // Record stage transition
      await tx.projectTimeline.create({
        data: {
          projectId: id,
          fromStage,
          toStage,
          transitionedBy: userId || 'SYSTEM',
          remarks: remarks || `Workflow advanced to ${toStage}`,
        },
      });

      // Record activity log
      await tx.projectActivity.create({
        data: {
          projectId: id,
          action: 'STAGE_CHANGED',
          description: `Advanced from ${fromStage} to ${toStage}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updatedProject;
    });
  }

  async getTimeline(id: string) {
    return this.prisma.projectTimeline.findMany({
      where: { projectId: id },
      orderBy: { transitionedAt: 'asc' },
    });
  }

  async getActivities(id: string) {
    return this.prisma.projectActivity.findMany({
      where: { projectId: id },
      orderBy: { performedAt: 'desc' },
    });
  }

  // --- Project Tasks (WBS) ---
  
  async getTasks(projectId: string) {
    return this.prisma.projectTask.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });
  }

  async createTask(projectId: string, data: any, userId?: string) {
    return this.prisma.projectTask.create({
      data: {
        ...data,
        projectId,
        createdBy: userId,
      },
    });
  }

  async updateTask(taskId: string, data: any, userId?: string) {
    return this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  // --- Quality Inspections ---
  async createInspection(projectId: string, data: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.inspectionHeader.create({
        data: {
          projectId,
          inspectionNumber: `INS-${Date.now()}`,
          inspectedQty: data.inspectedQty || 1,
          passedQty: data.passedQty || 1,
          result: data.result || 'PASS',
          inspectionType: data.inspectionType || 'IN_PROCESS',
          createdBy: userId,
        },
      });

      return inspection;
    });
  }
}
