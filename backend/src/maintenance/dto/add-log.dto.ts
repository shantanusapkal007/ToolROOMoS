import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AddLogDto {
  @IsString()
  @IsNotEmpty()
  actionTaken: string;

  @IsNumber()
  @IsOptional()
  timeSpentHours?: number;
}
