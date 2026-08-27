import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrnPriority, PrnCategory, CreatePrnItemDto } from './create-prn.dto';

export class UpdatePrnDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  requestedBy?: string;

  @IsOptional()
  @IsString()
  requiredDate?: string;

  @IsOptional()
  @IsEnum(PrnPriority)
  priority?: PrnPriority;

  @IsOptional()
  @IsEnum(PrnCategory)
  category?: PrnCategory;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrnItemDto)
  items?: CreatePrnItemDto[];

  @IsOptional()
  customFields?: Record<string, any>;
}
