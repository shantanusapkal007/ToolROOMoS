import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  skillLevel?: string;

  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;

  @IsNumber()
  @IsOptional()
  overtimeRate?: number;

  @IsOptional()
  machineCapability?: any;

  @IsString()
  @IsOptional()
  operatorCategory?: string;

  @IsNumber()
  @IsOptional()
  dailyWorkingHours?: number;

  @IsString()
  @IsOptional()
  defaultMachineId?: string;

  @IsString()
  @IsOptional()
  shiftId?: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsString()
  @IsOptional()
  costCentre?: string;

  @IsOptional()
  customFields?: any;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
