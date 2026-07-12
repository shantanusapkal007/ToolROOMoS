import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectTeamService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeam(projectId: string) {
    return this.prisma.projectTeam.findMany({ where: { projectId } });
  }

  async addTeamMember(projectId: string, data: any) {
    return this.prisma.projectTeam.create({ data: { ...data, projectId } });
  }

  async removeTeamMember(teamId: string) {
    return this.prisma.projectTeam.delete({ where: { id: teamId } });
  }
}
