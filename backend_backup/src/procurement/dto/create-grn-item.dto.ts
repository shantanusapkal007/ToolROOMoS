import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateGrnItemDto {
  @IsString()
  @IsNotEmpty()
  poItemId: string;

  @IsNumber()
  @IsNotEmpty()
  receivedQty: number;

  @IsNumber()
  @IsNotEmpty()
  acceptedQty: number;

  @IsNumber()
  @IsOptional()
  rejectedQty?: number;

  @IsString()
  @IsOptional()
  heatNumber?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsOptional()
  gstPercent?: number;

  @IsNumber()
  @IsNotEmpty()
  actualRate: number;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  rackLocation?: string;

  @IsString()
  @IsOptional()
  binLocation?: string;

  @IsOptional()
  customFields?: any;

  @IsString()
  @IsOptional()
  remarks?: string;
}
