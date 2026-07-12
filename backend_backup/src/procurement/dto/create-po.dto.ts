import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePoItemDto } from './create-po-item.dto';

export class CreatePoDto {
  @IsString()
  @IsNotEmpty()
  purchaseRequestId: string;

  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  vendorGstNumber?: string;

  @IsString()
  @IsOptional()
  costCentre?: string;

  @IsOptional()
  gstPercent?: number;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsOptional()
  discount?: number;

  @IsOptional()
  freight?: number;

  @IsOptional()
  customFields?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items: CreatePoItemDto[];
}
