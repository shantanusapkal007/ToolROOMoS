import { IsString, IsOptional, IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
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
  pan?: string;

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
  bankName?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  ifsc?: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsNumber()
  @IsOptional()
  creditDays?: number;

  @IsOptional()
  contactPersons?: any;

  @IsOptional()
  approvedMaterials?: any;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsOptional()
  customFields?: any;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
