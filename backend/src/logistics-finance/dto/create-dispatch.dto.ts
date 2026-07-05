import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateDispatchDto {
  @IsString()
  @IsNotEmpty()
  dispatchNumber: string;

  @IsNumber()
  @IsNotEmpty()
  dispatchQty: number;

  @IsString()
  @IsOptional()
  transporterName?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @IsNumber()
  @IsNotEmpty()
  logisticsCost: number;

  @IsString()
  @IsOptional()
  driverDetails?: string;

  @IsString()
  @IsOptional()
  trackingReference?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
