import { IsString, IsOptional, IsNotEmpty, IsDateString, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export class CreateProjectTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  estimatedHours?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
