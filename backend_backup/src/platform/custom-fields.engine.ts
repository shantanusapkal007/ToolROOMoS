// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomFieldsEngine {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all active custom field definitions for a specific entity type.
   */
  async getDefinitions(moduleName: string) {
    return this.prisma.customFieldDefinition.findMany({
      where: { module: moduleName },
    });
  }

  /**
   * Validates a JSON payload of custom fields against the defined schema.
   */
  async validatePayload(moduleName: string, payload: Record<string, any>) {
    if (!payload) return;

    const definitions = await this.getDefinitions(moduleName);
    
    // Check required fields
    for (const def of definitions) {
      const value = payload[def.fieldName];
      
      if (def.isRequired && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`Custom field '${def.fieldName}' is required.`);
      }

      if (value !== undefined && value !== null) {
        // Basic type checking
        if (def.fieldType === 'NUMBER' && typeof value !== 'number') {
          throw new BadRequestException(`Custom field '${def.fieldName}' must be a number.`);
        }
        if (def.fieldType === 'BOOLEAN' && typeof value !== 'boolean') {
          throw new BadRequestException(`Custom field '${def.fieldName}' must be a boolean.`);
        }
        if (def.fieldType === 'SELECT' && def.options) {
          const optionsArray = def.options as any[];
          if (Array.isArray(optionsArray)) {
            const validValues = optionsArray.map(opt => opt.value);
            if (!validValues.includes(value)) {
              throw new BadRequestException(`Invalid option for custom field '${def.fieldName}'.`);
            }
          }
        }
      }
    }
  }
}

