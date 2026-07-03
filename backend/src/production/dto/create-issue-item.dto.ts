import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateIssueItemDto {
  @IsString()
  @IsNotEmpty()
  inventoryBatchId: string;

  @IsNumber()
  @IsNotEmpty()
  issuedQty: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
