import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SubcontractReceiptItemDto {
  @IsString()
  orderItemId: string;

  @IsNumber()
  receivedQty: number;

  @IsNumber()
  acceptedQty: number;

  @IsNumber()
  rejectedQty: number;

  @IsNumber()
  actualRate: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateSubcontractReceiptDto {
  @IsString()
  subcontractOrderId: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubcontractReceiptItemDto)
  items: SubcontractReceiptItemDto[];
}
