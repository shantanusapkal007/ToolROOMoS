import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsBoolean()
  @IsOptional()
  lotoApplied?: boolean;
}
