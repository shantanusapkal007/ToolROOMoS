import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

/**
 * UpdateCustomerDto
 * 
 * All fields from CreateCustomerDto become optional for PATCH updates.
 */
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
