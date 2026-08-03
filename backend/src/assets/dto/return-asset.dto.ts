import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class ReturnAssetDto {
  @IsString()
  @IsNotEmpty()
  issueTransactionId: string;

  @IsNumber()
  @Min(1)
  returnedQty: number;

  @IsString()
  @IsOptional()
  returnDate?: string;

  @IsString()
  @IsOptional()
  conditionAfterReturn?: string;

  @IsString()
  @IsOptional()
  damageDetails?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
