import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  jobCardId: string;

  @IsUUID()
  @IsNotEmpty()
  machineId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledStartTime: string;
}
