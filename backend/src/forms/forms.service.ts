import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveForm(formId: string, name: string, schema: any) {
    return this.prisma.dynamic_forms.upsert({
      where: { formId },
      update: {
        name,
        schema,
        updatedAt: new Date(),
      },
      create: {
        id: formId,
        formId,
        name,
        schema,
        updatedAt: new Date(),
      },
    });
  }

  async getForms() {
    return this.prisma.dynamic_forms.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getForm(formId: string) {
    return this.prisma.dynamic_forms.findUnique({
      where: { formId },
    });
  }
}
