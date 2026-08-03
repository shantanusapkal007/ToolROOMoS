import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemRole, RolePermission } from '@prisma/client';

export const MODULE_REGISTRY = [
  { id: 'dashboard', name: 'Mission Control', description: 'Main dashboard' },
  { id: 'projects', name: 'Projects', description: 'Project workspace' },
  { id: 'master_data', name: 'Master Data', description: 'Materials, machines, vendors, etc.' },
  { id: 'procurement', name: 'Procurement', description: 'Purchase orders, vendor POs' },
  { id: 'production', name: 'Production', description: 'Job cards, MSDRs, scheduling' },
  { id: 'quality', name: 'Quality', description: 'Inspection, NCRs' },
  { id: 'inventory', name: 'Inventory', description: 'Stock ledger, GRNs' },
  { id: 'engineering', name: 'Engineering', description: 'BOMs, routings, drawings' },
  { id: 'finance', name: 'Finance', description: 'Invoices, costing' },
  { id: 'reports', name: 'Reports', description: 'All reports' },
  { id: 'maintenance', name: 'Maintenance', description: 'Machine maintenance' },
  { id: 'settings', name: 'Settings', description: 'System settings' },
  { id: 'activity_log', name: 'Activity Log', description: 'Audit trail' },
  { id: 'hr', name: 'HR', description: 'Human resources' },
];

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  getModuleRegistry() {
    return MODULE_REGISTRY;
  }

  async getPermissionsForRole(role: SystemRole): Promise<RolePermission[]> {
    return this.prisma.rolePermission.findMany({
      where: { role },
    });
  }

  async getAllPermissions() {
    const roles = Object.values(SystemRole).filter(r => r !== 'ADMIN'); // ADMIN has full access
    const permissions = await this.prisma.rolePermission.findMany({
      where: { role: { in: roles } }
    });

    return { roles, modules: MODULE_REGISTRY, permissions };
  }

  async upsertPermissions(role: SystemRole, permissions: Array<Partial<RolePermission>>) {
    if (role === 'ADMIN') {
      throw new Error('Cannot modify ADMIN permissions. ADMIN has full access implicitly.');
    }

    const results = [];
    for (const perm of permissions) {
      if (!perm.module) continue;
      
      const result = await this.prisma.rolePermission.upsert({
        where: {
          role_module: {
            role,
            module: perm.module,
          }
        },
        update: {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
          canApprove: perm.canApprove,
          canExport: perm.canExport,
          updatedBy: perm.updatedBy || 'SYSTEM',
        },
        create: {
          role,
          module: perm.module,
          canView: perm.canView || false,
          canCreate: perm.canCreate || false,
          canEdit: perm.canEdit || false,
          canDelete: perm.canDelete || false,
          canApprove: perm.canApprove || false,
          canExport: perm.canExport || false,
          createdBy: perm.updatedBy || 'SYSTEM',
        }
      });
      results.push(result);
    }
    
    return results;
  }

  async getRolesSummary() {
    const roles = Object.values(SystemRole);
    
    // Count users for each role
    const userCounts = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const userCountMap = new Map(userCounts.map(u => [u.role, u._count.role]));

    // Fetch all role permissions
    const allPermissions = await this.prisma.rolePermission.findMany();

    const roleSummaries = roles.map(r => {
      const perms = allPermissions.filter(p => p.role === r);
      const activeModulesCount = perms.filter(p => p.canView).length;
      return {
        role: r,
        name: r.replace('_', ' '),
        description: this.getRoleDescription(r),
        userCount: userCountMap.get(r) || 0,
        activeModulesCount: r === 'ADMIN' ? MODULE_REGISTRY.length : activeModulesCount,
        totalModules: MODULE_REGISTRY.length,
        isSystemAdmin: r === 'ADMIN',
      };
    });

    return roleSummaries;
  }

  private getRoleDescription(role: SystemRole): string {
    switch (role) {
      case 'ADMIN': return 'Full system control, workspace config & user governance.';
      case 'PRODUCTION': return 'Shop floor execution, job cards, MSDR daily reports & machine logs.';
      case 'ENGINEERING': return 'BOMs, routings, CAD drawings, revisions & design logs.';
      case 'QUALITY': return 'Inspection standards, First-Piece/In-process inspection, PDI & NCRs.';
      case 'PURCHASE': return 'Purchase Requests, Supplier POs, Vendor bills & Purchase returns.';
      case 'STORES': return 'Goods Receipt Notes (GRN), Inventory Stock, Heat # tracking & Store issuances.';
      case 'FINANCE': return 'Invoicing, cost calculations, financial ledger & customer payments.';
      case 'SALES': return 'Customer management, project proposals & order confirmation.';
      case 'SALES_ENGINEER': return 'Technical feasibility, quotation estimation & engineering sales support.';
      default: return 'Custom operational role with tailored permissions.';
    }
  }

  async applyPreset(role: SystemRole, presetType: 'FULL' | 'READ_ONLY' | 'SUPERVISOR' | 'CLEAR', updatedBy: string = 'SYSTEM') {
    if (role === 'ADMIN') {
      throw new Error('Cannot modify ADMIN permissions.');
    }

    const permissions: Array<Partial<RolePermission>> = MODULE_REGISTRY.map(mod => {
      if (presetType === 'FULL') {
        return { module: mod.id, canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true };
      } else if (presetType === 'READ_ONLY') {
        return { module: mod.id, canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true };
      } else if (presetType === 'SUPERVISOR') {
        return { module: mod.id, canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true };
      } else {
        return { module: mod.id, canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false };
      }
    });

    return this.upsertPermissions(role, permissions);
  }

  async hasPermission(role: SystemRole, module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canApprove' | 'canExport'): Promise<boolean> {
    if (role === 'ADMIN') return true;

    const perm = await this.prisma.rolePermission.findUnique({
      where: {
        role_module: { role, module }
      }
    });

    if (!perm) return false;
    return perm[action] === true;
  }
}

