import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

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

  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsString()
  @IsNotEmpty()
  plantId: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
