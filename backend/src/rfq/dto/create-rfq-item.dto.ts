import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateRfqItemDto {
  @IsString()
  @IsNotEmpty()
  partName: string;

  @IsString()
  @IsOptional()
  partDescription?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  uom?: string;

  @IsString()
  @IsOptional()
  specifications?: string;

  @IsString()
  @IsOptional()
  drawingReference?: string;

  @IsNumber()
  @IsOptional()
  targetPrice?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
