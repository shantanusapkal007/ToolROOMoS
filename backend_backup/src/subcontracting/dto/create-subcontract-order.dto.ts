import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class SubcontractOrderItemDto {
  @IsUUID()
  @IsOptional()
  inventoryBatchId?: string;

  @IsUUID()
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
  @IsUUID()
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
