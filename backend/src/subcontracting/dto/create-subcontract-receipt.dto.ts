import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SubcontractReceiptItemDto {
  @IsString()
  orderItemId: string;

  @Type(() => Number)
  @IsNumber()
  receivedQty: number;

  @Type(() => Number)
  @IsNumber()
  acceptedQty: number;

  @Type(() => Number)
  @IsNumber()
  rejectedQty: number;

  @Type(() => Number)
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
