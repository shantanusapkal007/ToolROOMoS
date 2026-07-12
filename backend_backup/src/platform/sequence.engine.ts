// @ts-nocheck
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SequenceEngine {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates the next document number for a given document type.
   * Format: [PREFIX]-[FINANCIAL_YEAR]-[ZERO_PADDED_NUMBER]
   * Example: PO-2026-00001
   */
  async generateNextNumber(documentType: string): Promise<string> {
    // Transaction ensures no two concurrent requests get the same number
    return await this.prisma.$transaction(async (tx) => {
      const sequence = await tx.documentSequence.findUnique({
        where: { documentType },
      });

      if (!sequence) {
        throw new InternalServerErrorException(
          `Document Sequence not configured for ${documentType}`,
        );
      }

      const currentNumber = sequence.nextNumber;
      const paddedNumber = currentNumber
        .toString()
        .padStart(sequence.padding, '0');

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

