import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class MultiPoItemDto {
  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  toolNo?: string;

  @IsString()
  @IsOptional()
  detNo?: string;

  @IsString()
  @IsOptional()
  length?: string;

  @IsString()
  @IsOptional()
  width?: string;

  @IsString()
  @IsOptional()
  height?: string;

  @IsString()
  @IsOptional()
  materialGrade?: string;

  @IsString()
  @IsOptional()
  materialId?: string;

  @IsString()
  @IsOptional()
  bomItemId?: string;

  @IsNumber()
  @IsNotEmpty()
  orderedQty: number;

  @IsNumber()
  @IsOptional()
  apWt?: number;

  @IsNumber()
  @IsOptional()
  totalWt?: number;

  @IsNumber()
  @IsNotEmpty()
  agreedRate: number;

  @IsNumber()
  @IsOptional()
  basicValue?: number;

  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @IsNumber()
  @IsOptional()
  gstAmount?: number;

  @IsNumber()
  @IsOptional()
  lineTotal?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsString()
  @IsOptional()
  uom?: string;

  @IsOptional()
  customFields?: any;
}

export class CreateMultiPoDto {
  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  vendorName?: string;

  @IsString()
  @IsOptional()
  vendorAddress?: string;

  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsString()
  @IsOptional()
  rmSlipNo?: string;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  customFields?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiPoItemDto)
  items: MultiPoItemDto[];
}
