import { IsString, IsOptional, IsEmail, IsEnum, IsUUID, IsIn } from 'class-validator';
import { SystemRole } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(SystemRole)
  @IsOptional()
  role?: SystemRole;

  @IsUUID()
  @IsOptional()
  plantId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
