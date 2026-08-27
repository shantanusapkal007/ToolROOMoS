import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class UpdateRfqStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // NEW, ESTIMATION, QUOTED, REVISION, WON, LOST, CANCELLED

  @IsString()
  @IsOptional()
  lostReason?: string;
}
