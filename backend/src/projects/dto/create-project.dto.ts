import { IsString, IsOptional, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

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

  @IsUUID()
  @IsNotEmpty()
  plantId: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
