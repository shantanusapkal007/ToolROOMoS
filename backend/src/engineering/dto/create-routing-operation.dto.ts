import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateRoutingOperationDto {
  @IsNumber()
  @Min(1)
  sequenceOrder: number;

  @IsString()
  operationId: string;

  @IsString()
  @IsOptional()
  machineId?: string;

  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedSetupTime?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
