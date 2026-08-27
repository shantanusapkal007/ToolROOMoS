import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConvertPoItemDto {
  @IsString()
  @IsNotEmpty()
  prItemId: string;

  @IsNumber()
  @Min(0.001)
  orderedQty: number;

  @IsNumber()
  @Min(0)
  agreedRate: number;

  @IsOptional()
  @IsNumber()
  gstPercent?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ConvertPrnToPoDto {
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConvertPoItemDto)
  items?: ConvertPoItemDto[];
}
