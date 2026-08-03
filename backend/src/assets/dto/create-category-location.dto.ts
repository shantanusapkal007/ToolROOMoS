import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  categoryCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  locationCode: string;

  @IsString()
  @IsNotEmpty()
  locationName: string;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  room?: string;

  @IsString()
  @IsOptional()
  rackBin?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
