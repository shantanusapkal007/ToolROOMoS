import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

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
  cuttingTime?: number;

  @IsNumber()
  @IsOptional()
  idleTime?: number;

  @IsNumber()
  @IsOptional()
  producedQty?: number;

  @IsNumber()
  @IsOptional()
  scrapQty?: number;

  @IsNumber()
  @IsOptional()
  reworkQty?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
