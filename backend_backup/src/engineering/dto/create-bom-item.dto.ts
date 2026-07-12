import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateBomItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsString()
  @IsOptional()
  rawSize?: string;

  @IsNumber()
  @IsOptional()
  calculatedWeight?: number;

  @IsNumber()
  @IsNotEmpty()
  requiredQty: number;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
