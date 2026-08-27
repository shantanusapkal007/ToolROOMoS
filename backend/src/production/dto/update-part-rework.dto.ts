import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdatePartReworkDto {
  @IsOptional()
  @IsString()
  status?: string; // REQUESTED, APPROVED, IN_REWORK, RE_INSPECTION, COMPLETED, REJECTED_SCRAPPED

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  machineId?: string;

  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsNumber()
  costImpact?: number;

  @IsOptional()
  @IsString()
  inspectionResult?: string; // PENDING, PASSED, FAILED_SCRAP

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
