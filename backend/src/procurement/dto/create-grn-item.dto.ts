import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateGrnItemDto {
  @IsString()
  @IsNotEmpty()
  poItemId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  receivedQty: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  acceptedQty: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rejectedQty?: number;

  @IsString()
  @IsOptional()
  heatNumber?: string;

  @IsNumber()
  @IsNotEmpty()
  actualRate: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @IsString()
  @IsOptional()
  toolNo?: string;

  @IsString()
  @IsOptional()
  detNo?: string;

  @IsNumber()
  @IsOptional()
  length?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  apWeight?: number;

  @IsNumber()
  @IsOptional()
  totalWeight?: number;

  @IsNumber()
  @IsOptional()
  basicCost?: number;

  @IsNumber()
  @IsOptional()
  gst?: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}
