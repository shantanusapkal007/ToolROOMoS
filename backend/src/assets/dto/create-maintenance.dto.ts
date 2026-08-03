import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  issueReported: string;

  @IsString()
  @IsOptional()
  assignedTechnician?: string;

  @IsString()
  @IsOptional()
  maintenanceStart?: string;

  @IsString()
  @IsOptional()
  maintenanceEnd?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CompleteMaintenanceDto {
  @IsString()
  @IsOptional()
  maintenanceEnd?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  conditionAfterMaintenance?: string;
}
