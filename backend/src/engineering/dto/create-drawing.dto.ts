import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDrawingDto {
  @IsString()
  @IsNotEmpty()
  drawingNumber: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
