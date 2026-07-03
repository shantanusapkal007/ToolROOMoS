import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePoItemDto } from './create-po-item.dto';

export class CreatePoDto {
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items: CreatePoItemDto[];
}
