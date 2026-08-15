import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssemblyComponentDto {
  @IsString()
  @IsNotEmpty()
  componentName: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateAssemblyOrderDto {
  @IsString()
  @IsNotEmpty()
  assemblyNumber: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssemblyComponentDto)
  components?: AssemblyComponentDto[];
}
