import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsUUID, IsIn, IsNumber } from 'class-validator';
import { SystemRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(SystemRole)
  @IsOptional()
  role?: SystemRole;

  @IsUUID()
  @IsOptional()
  plantId?: string;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;
}
