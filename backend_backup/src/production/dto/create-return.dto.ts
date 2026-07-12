import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsPositive } from 'class-validator';

export class CreateReturnDto {
  @IsUUID()
  @IsNotEmpty()
  issueId: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  returnQty: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
