import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateIssueItemDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryBatchId: string;

  @IsNumber()
  @IsNotEmpty()
  issuedQty: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
