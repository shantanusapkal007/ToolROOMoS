import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  async companies() {
    return this.prisma.company.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { companyName: 'asc' },
      select: { id: true, companyCode: true, companyName: true },
    });
  }

  async plants() {
    return this.prisma.plant.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { plantName: 'asc' },
      select: { id: true, plantCode: true, plantName: true, companyId: true },
    });
  }

  async departments() {
    return this.prisma.department.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { departmentName: 'asc' },
      select: { id: true, departmentCode: true, departmentName: true, plantId: true },
    });
  }

  async shifts() {
    return this.prisma.shift.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { shiftName: 'asc' },
      select: { id: true, shiftName: true, startTime: true, endTime: true },
    });
  }

  async materialShapes() {
    return this.prisma.materialShape.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { shapeName: 'asc' },
      select: { id: true, shapeName: true },
    });
  }

  // --- Quick Create Methods ---

  async createCompany(data: any) {
    return this.prisma.company.create({
      data: {
        companyName: data.companyName,
        companyCode: data.companyCode || `COMP-${Date.now()}`
      },
    });
  }

  async createPlant(data: any) {
    return this.prisma.plant.create({
      data: {
        plantName: data.plantName,
        plantCode: data.plantCode || `PLNT-${Date.now()}`,
        companyId: data.companyId,
      },
    });
  }

  async createDepartment(data: any) {
    return this.prisma.department.create({
      data: {
        departmentName: data.departmentName,
        departmentCode: data.departmentCode || `DEPT-${Date.now()}`,
        plantId: data.plantId,
      },
    });
  }

  async createShift(data: any) {
    return this.prisma.shift.create({
      data: {
        shiftName: data.shiftName,
        startTime: data.startTime || '00:00',
        endTime: data.endTime || '23:59',
      },
    });
  }

  async createMaterialShape(data: any) {
    return this.prisma.materialShape.create({
      data: {
        shapeName: data.shapeName,
      },
    });
  }

  // --- Dynamic Category Options ---

  async getCategoryOptions(category?: string) {
    const whereClause = category ? { category } : {};
    let options = await this.prisma.masterCategoryOption.findMany({
      where: whereClause,
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });

    // Auto-seed defaults if requesting a specific category and DB is empty for it
    if (category && options.length === 0) {
      options = await this.seedDefaultCategoryOptions(category);
    }

    return options;
  }

  async createCategoryOption(dto: { category: string; code?: string; label: string; description?: string }) {
    const code = (dto.code || dto.label.toUpperCase().replace(/[^A-Z0-9]/g, '_')).trim();
    return this.prisma.masterCategoryOption.upsert({
      where: {
        category_code: {
          category: dto.category.toUpperCase(),
          code: code,
        },
      },
      update: {
        label: dto.label,
        description: dto.description || '',
      },
      create: {
        category: dto.category.toUpperCase(),
        code: code,
        label: dto.label,
        description: dto.description || '',
        isSystem: false,
      },
    });
  }

  async deleteCategoryOption(id: string) {
    return this.prisma.masterCategoryOption.delete({
      where: { id },
    });
  }

  private async seedDefaultCategoryOptions(category: string) {
    const defaults: Record<string, { code: string; label: string; description?: string }[]> = {
      PRODUCTION_SECTION: [
        { code: 'MACHINE_SHOP', label: 'Machine Shop (CNC/VMC/EDM)' },
        { code: 'PRESS_SHOP', label: 'Press Shop & Tryout' },
        { code: 'TOOL_ROOM_FITTING', label: 'Tool Room Fitting & Assembly' },
        { code: 'FABRICATION_INDIAN', label: 'Fabrication (Domestic)' },
        { code: 'FABRICATION_EXPORT', label: 'Fabrication (Export)' },
        { code: 'QUALITY_INSPECTION', label: 'Quality & CMM Inspection' },
        { code: 'OUTSOURCED', label: 'Outsourced / Job Work' },
      ],
      CAD_TOOL: [
        { code: 'SOLIDWORKS', label: 'SolidWorks' },
        { code: 'UG_NX', label: 'Siemens UG NX' },
        { code: 'AUTOCAD', label: 'AutoCAD Mechanical' },
        { code: 'CATIA', label: 'Dassault CATIA' },
        { code: 'CREO', label: 'PTC Creo' },
      ],
      WORK_STAGE: [
        { code: '3D_CAD_MODELING', label: '3D CAD Modeling' },
        { code: '2D_DETAILING', label: '2D Detailing & Drafting' },
        { code: 'ELECTRODE_DESIGN', label: 'Electrode Design & Extract' },
        { code: 'CAM_TOOLPATH', label: 'CAM Toolpath Generation' },
        { code: 'FEA_SIMULATION', label: 'FEA & Mold Flow Simulation' },
        { code: 'TOLERANCE_STACKUP', label: 'Tolerance Stackup & DFM' },
        { code: 'REVISION_CHANGE', label: 'Revision Change / ECN' },
        { code: 'BOM_ASSEMBLY', label: 'BOM & Tool Assembly Layout' },
      ],
      UOM: [
        { code: 'NOS', label: 'NOS (Numbers)' },
        { code: 'SET', label: 'SET (Sets)' },
        { code: 'PCS', label: 'PCS (Pieces)' },
        { code: 'MTR', label: 'MTR (Meters)' },
        { code: 'KG', label: 'KG (Kilograms)' },
        { code: 'BOX', label: 'BOX (Boxes)' },
        { code: 'LOT', label: 'LOT (Lots)' },
      ],
      ASSET_CONDITION: [
        { code: 'NEW', label: 'NEW (Brand New)' },
        { code: 'EXCELLENT', label: 'EXCELLENT (Like New)' },
        { code: 'GOOD', label: 'GOOD (Operational)' },
        { code: 'FAIR', label: 'FAIR (Worn / Minor Defect)' },
        { code: 'POOR', label: 'POOR (Requires Repair)' },
        { code: 'DAMAGED', label: 'DAMAGED (Out of Order)' },
      ],
    };

    const categoryUpper = category.toUpperCase();
    const itemsToSeed = defaults[categoryUpper];
    if (!itemsToSeed) return [];

    const createdList = [];
    for (const item of itemsToSeed) {
      try {
        const created = await this.prisma.masterCategoryOption.create({
          data: {
            category: categoryUpper,
            code: item.code,
            label: item.label,
            description: item.description || '',
            isSystem: true,
          },
        });
        createdList.push(created);
      } catch (e) {
        // Ignore if already exists
      }
    }
    return createdList;
  }
}

