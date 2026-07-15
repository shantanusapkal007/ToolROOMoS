import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('api/v1/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('performedBy') performedBy?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (performedBy && performedBy !== 'ALL') {
      where.performedBy = performedBy;
    }
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const prismaAny = this.prisma as any;

    if (!prismaAny.auditLog) {
       return {
          status: 'success',
          data: [],
          meta: { total: 0, page: pageNumber, limit: pageSize, totalPages: 0 }
       };
    }

    const [total, items] = await Promise.all([
      prismaAny.auditLog.count({ where }),
      prismaAny.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Enhance items with user info (basic join in memory for speed)
    const userIds = [...new Set((items as any[]).map((i: any) => i.performedBy).filter((id: any) => id !== 'SYSTEM'))];
    let users: any[] = [];
    if (userIds.length > 0) {
      users = await this.prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, name: true, role: true }
      });
    }

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const enrichedItems = (items as any[]).map((item: any) => ({
      ...item,
      user: item.performedBy === 'SYSTEM' ? { name: 'System', role: 'SYSTEM' } : userMap.get(item.performedBy) || { name: 'Unknown User' }
    }));

    return {
      status: 'success',
      data: enrichedItems,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  @Get('stats')
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const prismaAny = this.prisma as any;
    if (!prismaAny.auditLog) {
       return {
          status: 'success',
          data: { totalToday: 0, mostActiveUser: null, mostActiveEntity: null, uniqueUsersActiveToday: 0 }
       };
    }

    const [totalToday, uniqueUsersToday, mostActiveEntityStats] = await Promise.all([
      prismaAny.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      prismaAny.auditLog.groupBy({
        by: ['performedBy'],
        where: { createdAt: { gte: today }, performedBy: { not: 'SYSTEM' } },
        _count: { performedBy: true },
        orderBy: { _count: { performedBy: 'desc' } },
        take: 1
      }),
      prismaAny.auditLog.groupBy({
        by: ['entityType'],
        where: { createdAt: { gte: today } },
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
        take: 1
      })
    ]);

    let mostActiveUser = null;
    if (uniqueUsersToday && uniqueUsersToday.length > 0) {
       const user = await this.prisma.user.findUnique({
          where: { id: uniqueUsersToday[0].performedBy },
          select: { name: true }
       });
       mostActiveUser = user ? user.name : 'Unknown';
    }

    const mostActiveEntity = mostActiveEntityStats && mostActiveEntityStats.length > 0 ? mostActiveEntityStats[0].entityType : 'None';

    const activeUsersCount = await prismaAny.auditLog.groupBy({
       by: ['performedBy'],
       where: { createdAt: { gte: today }, performedBy: { not: 'SYSTEM' } },
    });

    return {
      status: 'success',
      data: {
        totalToday,
        mostActiveUser,
        mostActiveEntity,
        uniqueUsersActiveToday: activeUsersCount ? activeUsersCount.length : 0
      }
    };
  }

  @Get('entity/:entityType/:entityId')
  async getEntityLogs(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const prismaAny = this.prisma as any;
    if (!prismaAny.auditLog) {
       return { status: 'success', data: [] };
    }

    const items = await prismaAny.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

     // Enhance items with user info
    const userIds = [...new Set((items as any[]).map((i: any) => i.performedBy).filter((id: any) => id !== 'SYSTEM'))];
    let users: any[] = [];
    if (userIds.length > 0) {
      users = await this.prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, name: true, role: true }
      });
    }

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const enrichedItems = (items as any[]).map((item: any) => ({
      ...item,
      user: item.performedBy === 'SYSTEM' ? { name: 'System', role: 'SYSTEM' } : userMap.get(item.performedBy) || { name: 'Unknown User' }
    }));

    return {
      status: 'success',
      data: enrichedItems,
    };
  }
}
