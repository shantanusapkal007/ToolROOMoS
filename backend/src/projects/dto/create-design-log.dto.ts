import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateDesignLogDto {
  @IsString()
  @IsNotEmpty()
  designerName: string;

  @IsString()
  @IsOptional()
  designerId?: string;

  @IsString()
  @IsNotEmpty()
  workStage: string;

  @IsString()
  @IsOptional()
  partName?: string;

  @IsString()
  @IsOptional()
  drawingNumber?: string;

  @IsString()
  @IsOptional()
  revision?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsOptional()
  workDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  hoursSpent?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  cadFileUrl?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateDesignLogDto extends CreateDesignLogDto {}
