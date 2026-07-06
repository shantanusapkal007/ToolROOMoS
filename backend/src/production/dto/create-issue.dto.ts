import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateIssueItemDto } from './create-issue-item.dto';

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  issueNumber: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIssueItemDto)
  items: CreateIssueItemDto[];
}
