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

  @IsOptional()
  generateOffcut?: boolean;

  @IsNumber()
  @IsOptional()
  offcutLength?: number;

  @IsNumber()
  @IsOptional()
  offcutWidth?: number;

  @IsNumber()
  @IsOptional()
  offcutThickness?: number;

  @IsNumber()
  @IsOptional()
  offcutWeight?: number;

  @IsString()
  @IsOptional()
  offcutRemarks?: string;
}
