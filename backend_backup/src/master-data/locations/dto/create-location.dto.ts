import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsOptional()
  locationCode?: string;

  @IsString()
  @IsOptional()
  locationName?: string;

  @IsString()
  @IsNotEmpty()
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

  @IsOptional()
  @IsString()
  remarks?: string;
}
