import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateRoutingOperationDto {
  @IsNumber()
  @Min(1)
  sequenceOrder: number;

  @IsString()
  operationId: string;

  @IsString()
  @IsOptional()
  plannedMachineId?: string;

  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedSetupTime?: number;

  @IsString()
  @IsOptional()
  operationName?: string;

  @IsString()
  @IsOptional()
  machineType?: string;

  @IsString()
  @IsOptional()
  machineGroup?: string;

  @IsNumber()
  @IsOptional()
  cycleTime?: number;

  @IsOptional()
  inspectionRequired?: boolean;

  @IsOptional()
  outsource?: boolean;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  customFields?: any;
}
