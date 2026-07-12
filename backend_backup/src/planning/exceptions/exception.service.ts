import { Injectable } from '@nestjs/common';
import { NetRequirement } from '../netting/inventory-netting.service';
import { Prisma } from '@prisma/client';

export interface ExceptionDraft {
  materialId: string;
  exceptionType: string;
  exceptionMessage: string;
  severity: string;
}

@Injectable()
export class ExceptionService {
  generateExceptions(netReqs: NetRequirement[]): ExceptionDraft[] {
    const exceptions: ExceptionDraft[] = [];

    for (const req of netReqs) {
      if (req.netQuantity > 0) {
        // Material Shortage
        exceptions.push({
          materialId: req.materialId,
          exceptionType: 'MATERIAL_SHORTAGE',
          exceptionMessage: `Shortage of ${req.netQuantity} detected. Gross: ${req.grossQuantity}, Available: ${req.availableStock}, Open PO: ${req.openPoQuantity}`,
          severity: 'CRITICAL'
        });
      }

      if (req.availableStock < 0) {
        // Negative Inventory
        exceptions.push({
          materialId: req.materialId,
          exceptionType: 'NEGATIVE_INVENTORY',
          exceptionMessage: `System detected negative stock (${req.availableStock}) for material.`,
          severity: 'WARNING'
        });
      }

      // Late Supply could be checked here if we passed dates down
    }

    return exceptions;
  }
}
