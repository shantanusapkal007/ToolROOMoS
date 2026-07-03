import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGrnItemDto } from './create-grn-item.dto';

export class CreateGrnDto {
  @IsString()
  @IsNotEmpty()
  poHeaderId: string;

  @IsString()
  @IsNotEmpty()
  grnNumber: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGrnItemDto)
  items: CreateGrnItemDto[];
}
