import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectScopeGuard implements CanActivate {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectId = request.body?.projectId || request.query?.projectId || request.params?.projectId || request.params?.id;

    if (!projectId) {
      return true;
    }

    const role = this.cls.get('userRole');
    if (role === 'ADMIN') {
      return true;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { plantId: true },
    });

    if (!project) {
      return true; // Let controller throw NotFound
    }

    const allowedPlants = this.cls.get('allowedPlants') as string[] || [];

    if (!allowedPlants.includes(project.plantId)) {
      throw new ForbiddenException(`You do not have access to the plant that owns this project.`);
    }

    return true;
  }
}
