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

  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;

  @IsString()
  @IsOptional()
  shiftId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  departmentName?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
  @IsString()
  @IsOptional()
  status?: string;
}

