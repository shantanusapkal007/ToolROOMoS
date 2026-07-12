// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * CustomFieldsService — Universal Custom Fields
 * 
 * Admin can define custom fields per module (Text, Number, Date, Checkbox, Dropdown, Currency, Attachment).
 * Fields are stored in JSON columns on each model's customFields column.
 * No coding required to add new fields.
 */
@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async defineField(params: {
    module: string;
    fieldName: string;
    fieldType: string;
    options?: any;
    isRequired?: boolean;
    sortOrder?: number;
    createdBy?: string;
  }) {
    return this.prisma.customFieldDefinition.upsert({
      where: {
        module_fieldName: {
          module: params.module,
          fieldName: params.fieldName,
        },
      },
      create: {
        module: params.module,
        fieldName: params.fieldName,
        fieldType: params.fieldType,
        options: params.options,
        isRequired: params.isRequired || false,
        sortOrder: params.sortOrder || 0,
        createdBy: params.createdBy,
      },
      update: {
        fieldType: params.fieldType,
        options: params.options,
        isRequired: params.isRequired,
        sortOrder: params.sortOrder,
      },
    });
  }

  async getDefinitions(module: string) {
    return this.prisma.customFieldDefinition.findMany({
      where: { module },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAllDefinitions() {
    return this.prisma.customFieldDefinition.findMany({
      orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async deleteField(id: string) {
    return this.prisma.customFieldDefinition.delete({ where: { id } });
  }

  /**
   * Validate custom field values against definitions
   */
  async validateCustomFields(module: string, values: Record<string, any>): Promise<string[]> {
    const definitions = await this.getDefinitions(module);
    const errors: string[] = [];

    for (const def of definitions) {
      const value = values[def.fieldName];
      if (def.isRequired && (value === undefined || value === null || value === '')) {
        errors.push(`Custom field "${def.fieldName}" is required.`);
      }
      if (value !== undefined && value !== null) {
        switch (def.fieldType) {
          case 'NUMBER':
          case 'CURRENCY':
            if (isNaN(Number(value))) errors.push(`Custom field "${def.fieldName}" must be a number.`);
            break;
          case 'DATE':
            if (isNaN(Date.parse(value))) errors.push(`Custom field "${def.fieldName}" must be a valid date.`);
            break;
          case 'CHECKBOX':
            if (typeof value !== 'boolean') errors.push(`Custom field "${def.fieldName}" must be true/false.`);
            break;
          case 'DROPDOWN':
            if (def.options && Array.isArray(def.options) && !def.options.includes(value)) {
              errors.push(`Custom field "${def.fieldName}" must be one of: ${(def.options as string[]).join(', ')}`);
            }
            break;
        }
      }
    }
    return errors;
  }
}

