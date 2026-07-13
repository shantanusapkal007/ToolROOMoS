import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePoItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @IsNotEmpty()
  orderedQty: number;

  @IsNumber()
  @IsNotEmpty()
  agreedRate: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @IsOptional()
  customFields?: any;

  @IsString()
  @IsOptional()
  uom?: string;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  cgst?: number;

  @IsNumber()
  @IsOptional()
  sgst?: number;

  @IsNumber()
  @IsOptional()
  basicValue?: number;
}
