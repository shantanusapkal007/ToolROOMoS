import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { VendorType } from '@prisma/client';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  vendorCode: string;

  @IsString()
  @IsNotEmpty()
  vendorName: string;

  @IsEnum(VendorType)
  @IsNotEmpty()
  vendorType: VendorType;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
  @IsString()
  @IsOptional()
  status?: string;
}

