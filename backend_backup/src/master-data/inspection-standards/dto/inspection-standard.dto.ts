import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateInspectionStandardDto {
  @IsString()
  standardCode: string;

  @IsString()
  standardName: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateInspectionStandardDto {
  @IsOptional()
  @IsString()
  standardCode?: string;

  @IsOptional()
  @IsString()
  standardName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
