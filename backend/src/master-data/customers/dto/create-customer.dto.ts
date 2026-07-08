import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

/**
 * CreateCustomerDto
 * 
 * Validates incoming requests for creating a new Customer Master.
 * Only business-relevant fields are exposed. IDs and audit fields
 * are handled automatically by the system.
 */
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  customerCode: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

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
