import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePoItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @IsNotEmpty()
  orderedQty: number;

  @IsNumber()
  @IsNotEmpty()
  agreedRate: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsOptional()
  gstPercent?: number;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsString()
  @IsOptional()
  heatNumber?: string;

  @IsString()
  @IsOptional()
  millCertificate?: string;

  @IsOptional()
  discount?: number;

  @IsOptional()
  customFields?: any;
}
