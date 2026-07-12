import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  materialCode: string;

  @IsString()
  @IsNotEmpty()
  materialGrade: string;

  @IsString()
  @IsOptional()
  materialCategory?: string;

  @IsNumber()
  @IsOptional()
  density?: number;

  @IsNumber()
  @IsOptional()
  standardCost?: number;

  @IsString()
  @IsNotEmpty()
  defaultUom: string;

  @IsString()
  @IsOptional()
  defaultVendor?: string;

  @IsString()
  @IsOptional()
  shapeId?: string;

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
  weightFormula?: string;

  @IsNumber()
  @IsOptional()
  standardLength?: number;

  @IsNumber()
  @IsOptional()
  standardWidth?: number;

  @IsNumber()
  @IsOptional()
  standardThickness?: number;

  @IsOptional()
  customFields?: any;

  @IsString()
  @IsOptional()
  preferredVendorId?: string;

  @IsString()
  @IsOptional()
  alternativeVendorId?: string;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @IsNumber()
  @IsOptional()
  leadTime?: number;

  @IsNumber()
  @IsOptional()
  purchaseCost?: number;

  @IsNumber()
  @IsOptional()
  scrapPercentage?: number;

  @IsNumber()
  @IsOptional()
  moq?: number;

  @IsString()
  @IsOptional()
  colourCode?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
