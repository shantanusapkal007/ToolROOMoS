import { IsNumber, IsOptional, IsString } from 'class-validator';

export class RfqCostEstimateDto {
  @IsString()
  @IsOptional()
  rfqItemId?: string;

  @IsNumber()
  @IsOptional()
  materialCost?: number;

  @IsNumber()
  @IsOptional()
  machiningHours?: number;

  @IsNumber()
  @IsOptional()
  machiningCost?: number;

  @IsNumber()
  @IsOptional()
  labourHours?: number;

  @IsNumber()
  @IsOptional()
  labourCost?: number;

  @IsNumber()
  @IsOptional()
  subcontractCost?: number;

  @IsNumber()
  @IsOptional()
  overheadPercent?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
