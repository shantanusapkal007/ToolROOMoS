import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMsdrOperationDto {
  @IsString()
  @IsOptional()
  routingOperationId?: string;

  @IsString()
  @IsOptional()
  materialIssueId?: string;

  @IsString()
  @IsOptional()
  inventoryBatchId?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsNumber()
  @IsOptional()
  setupTime?: number;

  @IsNumber()
  @IsOptional()
  runningHours?: number;

  @IsNumber()
  @IsOptional()
  producedQty?: number;

  @IsNumber()
  @IsOptional()
  scrapQty?: number;

  @IsNumber()
  @IsOptional()
  reworkQty?: number;

  @IsNumber()
  @IsOptional()
  downtime?: number;

  @IsString()
  @IsOptional()
  toolChange?: string;

  @IsString()
  @IsOptional()
  machineCondition?: string;

  @IsString()
  @IsOptional()
  approval?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  customFields?: any;
}

export class CreateMsdrDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  machineId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsOptional()
  shift?: string;

  @IsString()
  @IsOptional()
  supervisorId?: string;

  @IsDateString()
  @IsNotEmpty()
  reportDate: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  customFields?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMsdrOperationDto)
  operations: CreateMsdrOperationDto[];
}
