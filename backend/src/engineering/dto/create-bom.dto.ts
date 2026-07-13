import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBomItemDto } from './create-bom-item.dto';

export class CreateBomDto {
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  customFields?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items: CreateBomItemDto[];
}
