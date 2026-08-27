// @ts-nocheck
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SequenceEngine {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates the next document number for a given document type.
   * Format: [PREFIX]-[FINANCIAL_YEAR]-[ZERO_PADDED_NUMBER]
   * Example: RFQ-2026-0001 or PO-2026-00001
   */
  async generateNextNumber(documentType: string): Promise<string> {
    return await this.prisma.$transaction(async (tx) => {
      let sequence = await tx.documentSequence.findUnique({
        where: { documentType },
      });

      if (!sequence) {
        const currentYear = new Date().getFullYear().toString();
        sequence = await tx.documentSequence.create({
          data: {
            documentType,
            prefix: documentType,
            financialYear: currentYear,
            nextNumber: 1,
            padding: 4,
          },
        });
      }

      const currentNumber = sequence.nextNumber;
      const paddedNumber = currentNumber
        .toString()
        .padStart(sequence.padding || 4, '0');

      let documentNumber = '';
      if (sequence.prefix) {
        documentNumber += `${sequence.prefix}-`;
      }
      if (sequence.financialYear) {
        documentNumber += `${sequence.financialYear}-`;
      }
      documentNumber += paddedNumber;
      if (sequence.suffix) {
        documentNumber += `-${sequence.suffix}`;
      }

      // Increment sequence for next call
      await tx.documentSequence.update({
        where: { id: sequence.id },
        data: {
          nextNumber: currentNumber + 1,
        },
      });

      return documentNumber;
    });
  }
}
