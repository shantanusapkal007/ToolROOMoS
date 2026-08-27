import { IsString, IsOptional, IsNotEmpty, IsDateString, IsUUID, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  projectNumber: string;

  @IsString()
  @IsOptional()
  customerPoNumber?: string;

  @IsString()
  @IsNotEmpty()
  partName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  targetDeliveryDate?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  projectOwner?: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  plantId: string;

  @IsNumber()
  @IsOptional()
  revenue?: number;

  @IsNumber()
  @IsOptional()
  contractValue?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  rfqHeaderId?: string;
}
