import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  warehouseId: string;

  @IsOptional()
  @IsString()
  rack?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsOptional()
  @IsString()
  bin?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
