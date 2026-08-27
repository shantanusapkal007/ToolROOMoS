import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsOptional()
  targetType?: string; // 'MACHINE' | 'DIE_TOOL'

  @IsString()
  @IsOptional()
  machineId?: string;

  @IsString()
  @IsOptional()
  dieToolName?: string;

  @IsString()
  @IsOptional()
  toolNumber?: string;

  @IsString()
  @IsOptional()
  brokenComponent?: string;

  @IsNumber()
  @IsOptional()
  strokeCountAtFailure?: number;

  @IsString()
  @IsOptional()
  failureMode?: string;

  @IsString()
  @IsOptional()
  actionRequired?: string;

  @IsString()
  @IsNotEmpty()
  issueDescription: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsOptional()
  downtimeStartedAt?: Date | string;

  @IsBoolean()
  @IsOptional()
  lotoApplied?: boolean;
}
