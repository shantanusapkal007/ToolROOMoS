import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBomItemDto } from './create-bom-item.dto';

export class CreateBomDto {
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomItemDto)
  items: CreateBomItemDto[];
}
