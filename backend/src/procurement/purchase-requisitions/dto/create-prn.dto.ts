import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PrnPriority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum PrnCategory {
  RAW_MATERIAL = 'RAW_MATERIAL',
  STANDARD_PARTS = 'STANDARD_PARTS',
  CONSUMABLES = 'CONSUMABLES',
  TOOLING = 'TOOLING',
  SERVICE = 'SERVICE',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreatePrnItemDto {
  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsString()
  itemCode?: string;

  @IsOptional()
  @IsString()
  itemName?: string;

  @IsOptional()
  @IsString()
  materialGrade?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  rawSize?: string;

  @IsNumber()
  @Min(0.001)
  requiredQuantity: number;

  @IsOptional()
  @IsString()
  uom?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedRate?: number;

  @IsOptional()
  @IsString()
  detNo?: string;

  @IsOptional()
  @IsString()
  suggestedVendor?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  customFields?: Record<string, any>;
}

export class CreatePrnDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  requestedBy?: string;

  @IsOptional()
  @IsString()
  requiredDate?: string;

  @IsOptional()
  @IsEnum(PrnPriority)
  priority?: PrnPriority;

  @IsOptional()
  @IsEnum(PrnCategory)
  category?: PrnCategory;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrnItemDto)
  items: CreatePrnItemDto[];

  @IsOptional()
  customFields?: Record<string, any>;
}
