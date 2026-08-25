import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProjectTrialDto {
  @IsString()
  @IsNotEmpty()
  trialNumber: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  trialSequence?: number;

  @IsOptional()
  @IsString()
  trialType?: string; // T0, T1, T2, FINAL

  @IsOptional()
  @IsString()
  machineId?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  actionPlan?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
