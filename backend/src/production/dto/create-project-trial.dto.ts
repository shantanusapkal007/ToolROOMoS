import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProjectTrialDto {
  @IsString()
  @IsNotEmpty()
  trialNumber: string;

  @IsOptional()
  @IsString()
  trialStage?: string; // T0, T1, T2, T3, FINAL_BUYOFF, CUSTOMER_SAMPLE

  @IsOptional()
  trialDate?: string | Date;

  @IsOptional()
  @IsString()
  machineName?: string;

  @IsOptional()
  @IsString()
  pressTonnage?: string;

  @IsOptional()
  @IsString()
  spmRate?: string;

  @IsOptional()
  @IsString()
  bolsterHeight?: string;

  @IsOptional()
  @IsString()
  cushionPressure?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  sampleQty?: number;

  @IsOptional()
  @IsString()
  result?: string; // PASS, FAIL, REWORK_REQUIRED, PASSED_WITH_DEVIATION

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  defectLog?: string;

  @IsOptional()
  @IsString()
  inspectorName?: string;

  @IsOptional()
  @IsString()
  reportUrl?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
