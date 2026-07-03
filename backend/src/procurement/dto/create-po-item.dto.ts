import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePoItemDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @IsNotEmpty()
  orderedQty: number;

  @IsNumber()
  @IsNotEmpty()
  agreedRate: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
