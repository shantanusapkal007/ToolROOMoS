import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOperationDto {
  @IsString()
  @IsNotEmpty()
  operationCode: string;

  @IsString()
  @IsNotEmpty()
  operationName: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
