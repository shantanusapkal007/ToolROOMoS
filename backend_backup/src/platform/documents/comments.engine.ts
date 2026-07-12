// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class CommentsEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService
  ) {}

  async addComment(entityType: string, entityId: string, content: string) {
    const userId = this.cls.get('userId');
    if (!userId) throw new Error("Anonymous users cannot post comments.");

    return this.prisma.comment.create({
      data: {
        entityType,
        entityId,
        content,
        authorId: userId
      }
    });
  }

  async getComments(entityType: string, entityId: string) {
    return this.prisma.comment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' }
    });
  }
}

