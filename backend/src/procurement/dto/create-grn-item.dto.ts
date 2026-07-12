import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateGrnItemDto {
  @IsString()
  @IsNotEmpty()
  poItemId: string;

  @IsNumber()
  @IsNotEmpty()
  receivedQty: number;

  @IsNumber()
  @IsNotEmpty()
  acceptedQty: number;

  @IsNumber()
  @IsOptional()
  rejectedQty?: number;

  @IsString()
  @IsOptional()
  heatNumber?: string;

  @IsNumber()
  @IsNotEmpty()
  actualRate: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsNumber()
  @IsOptional()
  gstPercent?: number;
}
