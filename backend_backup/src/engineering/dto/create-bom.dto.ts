import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';

export class CreateBomItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @Type(() => Boolean)
  @IsOptional()
  isAssembly?: boolean;

  @IsString()
  @IsOptional()
  partNo?: string;

  @IsString()
  @IsOptional()
  partName?: string;

  @IsString()
  @IsOptional()
  materialGrade?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  finishSize?: string;

  @IsString()
  @IsOptional()
  rawSize?: string;

  @IsString()
  @IsOptional()
  heatTreatment?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  calculatedWeight?: number;

  @IsNumber()
  @IsNotEmpty()
  requiredQty: number;

  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  scrapPercent?: number;

  @IsNumber()
  @IsOptional()
  estimatedProcessCost?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
  
  @IsOptional()
  customFields?: any;
}

export class CreateBomDto {
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items: CreateBomItemDto[];
}
