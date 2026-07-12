import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMsdrItemDto {
  @IsString()
  @IsOptional()
  toolNo?: string;

  @IsString()
  @IsOptional()
  detNo?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  rawMatlSize?: string;

  @IsString()
  @IsOptional()
  materialId?: string;

  @IsString()
  @IsOptional()
  finishMatlSize?: string;

  @IsNumber()
  @IsOptional()
  qty?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;
}

export class CreateMsdrDto {
  @IsString()
  @IsNotEmpty()
  machineId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsNotEmpty()
  reportDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMsdrItemDto)
  items: CreateMsdrItemDto[];
}
