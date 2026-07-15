import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddSparePartDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsNumber()
  @Min(0.01)
  quantityConsumed: number;
}
