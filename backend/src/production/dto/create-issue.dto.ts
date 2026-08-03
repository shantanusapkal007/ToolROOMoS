import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateIssueItemDto } from './create-issue-item.dto';

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  issueNumber: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  productionSection?: string;

  @IsUUID()
  @IsOptional()
  jobCardId?: string;

  @IsBoolean()
  @IsOptional()
  isPartial?: boolean;

  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  expectedManufactureQty?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIssueItemDto)
  items: CreateIssueItemDto[];
}
