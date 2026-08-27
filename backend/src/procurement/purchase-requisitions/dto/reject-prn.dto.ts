import { IsString, IsNotEmpty } from 'class-validator';

export class RejectPrnDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
