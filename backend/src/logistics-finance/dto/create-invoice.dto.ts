import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsString()
  @IsNotEmpty()
  dispatchNoteId: string;

  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @IsNumber()
  @IsNotEmpty()
  taxAmount: number;

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
