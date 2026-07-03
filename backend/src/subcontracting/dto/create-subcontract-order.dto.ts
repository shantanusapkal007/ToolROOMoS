import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SubcontractOrderItemDto {
  @IsString()
  @IsOptional()
  inventoryBatchId?: string;

  @IsString()
  operationId: string;

  @IsNumber()
  sentQty: number;

  @IsNumber()
  rate: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateSubcontractOrderDto {
  @IsString()
  vendorId: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  expectedReturnDate?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubcontractOrderItemDto)
  items: SubcontractOrderItemDto[];
}
