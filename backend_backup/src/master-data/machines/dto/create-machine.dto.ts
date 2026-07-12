import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  @IsNotEmpty()
  machineCode: string;

  @IsString()
  @IsNotEmpty()
  machineName: string;

  @IsString()
  @IsNotEmpty()
  machineType: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsDateString()
  @IsOptional()
  installationDate?: string;

  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsNumber()
  @IsOptional()
  workingHoursPerShift?: number;

  @IsNumber()
  @IsOptional()
  powerConsumption?: number;

  @IsNumber()
  @IsOptional()
  setupHours?: number;

  @IsString()
  @IsOptional()
  machineGroup?: string;

  @IsNumber()
  @IsOptional()
  maintenanceFactor?: number;

  @IsNumber()
  @IsOptional()
  overtimeMultiplier?: number;

  @IsNumber()
  @IsOptional()
  efficiency?: number;

  @IsNumber()
  @IsOptional()
  utilizationTarget?: number;

  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  monthlyMaintenanceCost?: number;

  @IsString()
  @IsOptional()
  costCentre?: string;

  @IsString()
  @IsNotEmpty()
  plantId: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsOptional()
  customFields?: any;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
