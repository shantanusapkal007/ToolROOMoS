import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MultiSubcontractOrderItemDto {
  @IsString()
  projectId: string;

  @IsUUID()
  @IsOptional()
  inventoryBatchId?: string;

  @IsUUID()
  operationId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  sentQty: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  hoursPerPc?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateMultiSubcontractOrderDto {
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
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MultiSubcontractOrderItemDto)
  items: MultiSubcontractOrderItemDto[];
}
