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
  status?: string;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsNumber()
  @IsOptional()
  gstPercent?: number;
}
