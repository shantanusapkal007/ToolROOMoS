import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoutingOperationDto } from './create-routing-operation.dto';

export class CreateRoutingDto {
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoutingOperationDto)
  operations: CreateRoutingOperationDto[];
}
