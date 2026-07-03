import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { InspectionResult } from '@prisma/client';

export class CreateInspectionDto {
  @IsNumber()
  @IsNotEmpty()
  inspectedQty: number;

  @IsNumber()
  @IsNotEmpty()
  passedQty: number;

  @IsNumber()
  @IsOptional()
  reworkQty?: number;

  @IsNumber()
  @IsOptional()
  scrapQty?: number;

  @IsEnum(InspectionResult)
  @IsNotEmpty()
  result: InspectionResult;

  @IsString()
  @IsOptional()
  remarks?: string;
}
